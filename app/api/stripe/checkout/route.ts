import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { ensureDeviceAuthUser } from "@/lib/auth-admin";
import { sendInitiateCheckoutEvent, generateEventId } from "@/lib/meta-capi";
import {
  inferTierFromProductId,
  normalizeTierForPlan,
  resolveCheckoutPriceId,
  resolveCheckoutProductId,
  type CheckoutPlatform,
  type CheckoutPlan,
} from "@/lib/stripe-plan-config";
import { getCheckoutValue, PUBLIC_PRICING } from "@/lib/pricing";
import {
  isServerStripeDebugTestModeEnabled,
  isServerStripeUsingTestMode,
} from "@/lib/stripe-env";
import { getStripe } from "@/lib/stripe-server";
import {
  expireOpenCheckoutSessions,
  listOpenCheckoutSessionsForIdentity,
  matchesCheckoutSessionSelection,
} from "@/lib/stripe-checkout-sessions";
import { isDeviceEmail } from "@/lib/subscription-reconciliation";
import {
  isAccessGrantingStripeSubscriptionStatus,
  isCheckoutBlockingStripeSubscriptionStatus,
} from "@/lib/stripe-subscription-status";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function trimMetadataValue(value?: string | null, maxLength = 500) {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, maxLength) : undefined;
}

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    const {
      plan,
      userId,
      email,
      deviceId,
      affiliateRef,
      platform,
      metaAttribution,
    } = await request.json();
    const checkoutPlan = plan as CheckoutPlan;
    const checkoutPlatform: CheckoutPlatform =
      platform === "mobile" ? "mobile" : "web";
    const metaFbp = trimMetadataValue(metaAttribution?.fbp);
    const metaFbc = trimMetadataValue(metaAttribution?.fbc);
    const metaSourceUrl = trimMetadataValue(metaAttribution?.sourceUrl);
    const initiateCheckoutEventId = trimMetadataValue(
      metaAttribution?.initiateCheckoutEventId,
      128
    );
    const utmSource = trimMetadataValue(metaAttribution?.utm_source);
    const utmMedium = trimMetadataValue(metaAttribution?.utm_medium);
    const utmCampaign = trimMetadataValue(metaAttribution?.utm_campaign);
    const utmTerm = trimMetadataValue(metaAttribution?.utm_term);
    const utmContent = trimMetadataValue(metaAttribution?.utm_content);
    const mcFlow = trimMetadataValue(metaAttribution?.mc_flow);
    const mcSubscriberId = trimMetadataValue(metaAttribution?.mc_subscriber_id);
    const fbclid = trimMetadataValue(metaAttribution?.fbclid);

    if (!checkoutPlan) {
      return NextResponse.json(
        { error: "Missing plan" },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // --- FRAUD PROTECTION: Block self-referrals ---
    let cleanAffiliateRef = affiliateRef;
    if (affiliateRef && email) {
      try {
        // Check if this email belongs to the affiliate themselves
        const { data: affiliateData } = await supabase
          .from("affiliates")
          .select("email, ref_slug")
          .eq("ref_slug", affiliateRef)
          .maybeSingle();

        if (affiliateData?.email?.toLowerCase() === email.toLowerCase()) {
          console.log(`[FRAUD] Blocked self-referral: ${email} tried to use their own ref ${affiliateRef}`);
          cleanAffiliateRef = undefined; // Strip the affiliate ref
        }
      } catch {
        // Non-blocking: continue with original ref if check fails
      }
    }

    // Detect if we're using test or live mode based on the secret key
    const isTestMode = isServerStripeUsingTestMode();
    const isDebugStripeMode = isServerStripeDebugTestModeEnabled();
    
    const configuredPriceId = resolveCheckoutPriceId(checkoutPlan, checkoutPlatform);
    const configuredProductId = resolveCheckoutProductId(checkoutPlan, checkoutPlatform);
    
    // Log which product ID is being used for debugging
    console.log(
      `[Checkout] Platform: ${checkoutPlatform}, Plan: ${checkoutPlan}, Price ID: ${configuredPriceId}, Product ID: ${configuredProductId}, Debug Stripe Mode: ${isDebugStripeMode}, Stripe Test Key: ${isTestMode}`
    );

    if (!configuredPriceId && !configuredProductId) {
      return NextResponse.json(
        {
          error: `Invalid plan: ${plan}. Configure the matching Stripe product or price ID for the requested platform.`,
        },
        { status: 400 }
      );
    }
    
    // Prefer explicit price IDs so pricing changes can be rolled out safely without
    // depending on a product's default_price setting.
    let product: Stripe.Product | null = null;
    let priceId = configuredPriceId;

    if (configuredPriceId) {
      try {
        const price = await stripe.prices.retrieve(configuredPriceId, {
          expand: ["product"],
        });
        const priceIsTest = price.livemode === false;

        if (isTestMode && !priceIsTest) {
          return NextResponse.json(
            { error: `Price ${configuredPriceId} is a live mode price, but you're using a test mode key.` },
            { status: 400 }
          );
        }

        if (!isTestMode && priceIsTest) {
          return NextResponse.json(
            { error: `Price ${configuredPriceId} is a test mode price, but you're using a live mode key.` },
            { status: 400 }
          );
        }

        if (price.type !== "recurring") {
          return NextResponse.json(
            { error: `Price ${configuredPriceId} must be recurring for subscription checkout.` },
            { status: 400 }
          );
        }

      } catch (error: any) {
        if (error.code === "resource_missing") {
          const modeHint = isTestMode
            ? "Make sure you're using a test mode price ID and test mode keys."
            : "Make sure you're using a live mode price ID and live mode keys. Check your Stripe Dashboard.";
          return NextResponse.json(
            {
              error: `Price ${configuredPriceId} not found in ${isTestMode ? "test" : "live"} mode. ${modeHint}`,
              priceId: configuredPriceId,
              isTestMode,
            },
            { status: 400 }
          );
        }
        throw error;
      }
    } else {
      try {
        product = await stripe.products.retrieve(configuredProductId!);
        
        const productIsTest = product.livemode === false;
        
        if (isTestMode && !productIsTest) {
          return NextResponse.json(
            { error: `Product ${configuredProductId} is a live mode product, but you're using a test mode key. Please create a test product or use live mode keys.` },
            { status: 400 }
          );
        }
        
        if (!isTestMode && productIsTest) {
          return NextResponse.json(
            { error: `Product ${configuredProductId} is a test mode product, but you're using a live mode key.` },
            { status: 400 }
          );
        }
      } catch (error: any) {
        if (error.code === "resource_missing") {
          const modeHint = isTestMode 
            ? "Make sure you're using a test mode product ID and test mode keys."
            : "Make sure you're using a live mode product ID and live mode keys. Check your Stripe Dashboard.";
          return NextResponse.json(
            { 
              error: `Product ${configuredProductId} not found in ${isTestMode ? 'test' : 'live'} mode. ${modeHint}`,
              productId: configuredProductId,
              isTestMode
            },
            { status: 400 }
          );
        }
        throw error;
      }

      priceId = product.default_price as string;

      if (!priceId) {
        return NextResponse.json(
          { error: "Product has no default price" },
          { status: 400 }
        );
      }
    }

    // Get user email if userId provided
    let customerEmail = email;
    if (userId && !customerEmail) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      customerEmail = userData?.user?.email;
    }

    customerEmail = customerEmail?.trim().toLowerCase();
    const billingEmail =
      customerEmail && !isDeviceEmail(customerEmail)
        ? customerEmail
        : undefined;

    // Try to find or create Stripe customer for returning customers
    let customerId: string | undefined;
    const candidateCustomers = new Map<string, Stripe.Customer>();

    if (deviceId) {
      try {
        const ensuredDeviceUser = await ensureDeviceAuthUser(supabase, deviceId);
        const { data: trackedSubscription, error: trackedSubscriptionError } =
          await supabase
            .from("subscriptions")
            .select("stripe_customer_id")
            .eq("user_id", ensuredDeviceUser.userId)
            .maybeSingle();

        if (trackedSubscriptionError) {
          console.error(
            `[Checkout] Failed to look up tracked device subscription for device ${deviceId}:`,
            trackedSubscriptionError
          );
        }

        if (trackedSubscription?.stripe_customer_id) {
          customerId = trackedSubscription.stripe_customer_id;

          try {
            const trackedCustomer = await stripe.customers.retrieve(
              trackedSubscription.stripe_customer_id
            );

            if (!trackedCustomer.deleted) {
              candidateCustomers.set(trackedCustomer.id, trackedCustomer);
            }
          } catch (error) {
            console.error(
              `[Checkout] Failed to retrieve tracked customer ${trackedSubscription.stripe_customer_id} for device ${deviceId}:`,
              error
            );
          }
        }
      } catch (error) {
        console.error(
          `[Checkout] Failed to resolve device-backed customer for ${deviceId}:`,
          error
        );
      }
    }

    if (billingEmail) {
      try {
        // Search for existing customer by email
        const existingCustomers = await stripe.customers.list({
          email: billingEmail,
          limit: 10,
        });

        if (existingCustomers.data.length > 0) {
          for (const existingCustomer of existingCustomers.data) {
            candidateCustomers.set(existingCustomer.id, existingCustomer);
          }
        }
      } catch (error) {
        console.error("Error finding customer:", error);
        // Continue without customer
      }
    } else if (deviceId) {
      console.log(
        `[Checkout] Anonymous device checkout for ${deviceId}; allowing Stripe Checkout to collect the billing email instead of seeding a synthetic device email.`
      );
    }

    if (candidateCustomers.size > 0) {
      let blockingCustomer: Stripe.Customer | undefined;
      let blockingSubscription: Stripe.Subscription | undefined;

      for (const existingCustomer of candidateCustomers.values()) {
        try {
          const existingSubscriptions = await stripe.subscriptions.list({
            customer: existingCustomer.id,
            status: "all",
            limit: 10,
          });

          const existingAccessSubscription = existingSubscriptions.data.find(
            (subscription) =>
              isAccessGrantingStripeSubscriptionStatus(subscription.status)
          );

          if (existingAccessSubscription) {
            blockingCustomer = existingCustomer;
            blockingSubscription = existingAccessSubscription;
            break;
          }

          const existingBlockingSubscription = existingSubscriptions.data.find(
            (subscription) =>
              isCheckoutBlockingStripeSubscriptionStatus(subscription.status)
          );

          if (!blockingSubscription && existingBlockingSubscription) {
            blockingCustomer = existingCustomer;
            blockingSubscription = existingBlockingSubscription;
          }
        } catch (error) {
          console.error(
            `[Checkout] Error checking existing subscriptions for customer ${existingCustomer.id}:`,
            error
          );
        }
      }

      if (blockingCustomer && blockingSubscription) {
        customerId = blockingCustomer.id;
        console.log(
          `[Checkout] Customer ${customerId} already has ${blockingSubscription.status} subscription ${blockingSubscription.id}.`
        );

        if (
          isAccessGrantingStripeSubscriptionStatus(blockingSubscription.status)
        ) {
          let resolvedUserId = userId;

          if (!resolvedUserId && deviceId) {
            try {
              const ensuredDeviceUser = await ensureDeviceAuthUser(
                supabase,
                deviceId
              );
              resolvedUserId = ensuredDeviceUser.userId;
            } catch (error) {
              console.error(
                "[Checkout] Failed to repair device user before existing-subscription short-circuit:",
                error
              );
            }
          }

          if (resolvedUserId) {
            const inferredTier =
              inferTierFromProductId(
                blockingSubscription.items.data[0]?.price?.product as
                  | string
                  | undefined
              ) ?? normalizeTierForPlan(checkoutPlan);
            const blockingPeriodEnd = (blockingSubscription as any)
              .current_period_end;

            const { error: upsertError } = await supabase
              .from("subscriptions")
              .upsert(
                {
                  user_id: resolvedUserId,
                  stripe_customer_id: blockingCustomer.id,
                  stripe_subscription_id: blockingSubscription.id,
                  billing_provider: "stripe",
                  whop_user_id: null,
                  whop_membership_id: null,
                  billing_manage_url: null,
                  tier: inferredTier,
                  status: "active",
                  current_period_end: blockingPeriodEnd
                    ? new Date(blockingPeriodEnd * 1000).toISOString()
                    : new Date(
                        Date.now() + 365 * 24 * 60 * 60 * 1000
                      ).toISOString(),
                  updated_at: new Date().toISOString(),
                },
                {
                  onConflict: "user_id",
                }
              );

            if (upsertError) {
              console.error(
                "[Checkout] Failed to sync existing subscription before returning already_subscribed:",
                upsertError
              );
            }
          }

          return NextResponse.json({
            url: `${request.nextUrl.origin}/checkout-success?already_subscribed=true`,
            alreadySubscribed: true,
            message: "You already have an active subscription!",
          });
        }

        const portalSession = await stripe.billingPortal.sessions.create({
          customer: blockingCustomer.id,
          return_url: `${request.nextUrl.origin}/settings`,
        });

        return NextResponse.json({
          url: portalSession.url,
          alreadySubscribed: true,
          message:
            "You already have a subscription on this device. Please update billing instead of starting a second one.",
        });
      }

      customerId = Array.from(candidateCustomers.keys())[0] || customerId;
    }

    if (!customerId && isTestMode) {
      try {
        const createdCustomer = await stripe.customers.create({
          ...(billingEmail && { email: billingEmail }),
          metadata: {
            ...(userId && { userId }),
            ...(deviceId && { deviceId }),
            source: "debug_checkout",
          },
        });

        customerId = createdCustomer.id;
        console.log(
          `[Checkout] Created test-mode customer ${customerId} before Checkout session creation.`
        );
      } catch (error) {
        console.error("[Checkout] Failed to create test-mode customer:", error);
        throw error;
      }
    }

    // Create Stripe checkout session - works with or without signed in user
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      // Use existing customer if found, otherwise let Stripe create one
      ...(customerId && { customer: customerId }),
      // If no existing customer, pre-fill email (or Stripe will collect it)
      ...(!customerId && billingEmail && { customer_email: billingEmail }),
      // Store userId if available for direct linking
      ...(userId && { client_reference_id: userId }),
      // Always collect billing address (ensures email is collected)
      billing_address_collection: "required",
      success_url: `${request.nextUrl.origin}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/?canceled=true`,
      metadata: {
        ...(userId && { userId }),
        plan: checkoutPlan,
        platform: checkoutPlatform,
        ...(isDebugStripeMode && { debug_mode: "true" }),
        ...(billingEmail && { email: billingEmail }),
        ...(deviceId && { deviceId }),
        ...(cleanAffiliateRef && { affiliate_ref: cleanAffiliateRef }),
        ...(metaFbp && { meta_fbp: metaFbp }),
        ...(metaFbc && { meta_fbc: metaFbc }),
        ...(metaSourceUrl && { meta_source_url: metaSourceUrl }),
        ...(initiateCheckoutEventId && {
          meta_initiate_checkout_event_id: initiateCheckoutEventId,
        }),
        ...(utmSource && { utm_source: utmSource }),
        ...(utmMedium && { utm_medium: utmMedium }),
        ...(utmCampaign && { utm_campaign: utmCampaign }),
        ...(utmTerm && { utm_term: utmTerm }),
        ...(utmContent && { utm_content: utmContent }),
        ...(mcFlow && { mc_flow: mcFlow }),
        ...(mcSubscriberId && { mc_subscriber_id: mcSubscriberId }),
        ...(fbclid && { fbclid: fbclid }),
      },
      subscription_data: {
        metadata: {
          ...(cleanAffiliateRef && { affiliate_ref: cleanAffiliateRef }),
        },
      },
    };

    try {
      const openSessionsForIdentity = await listOpenCheckoutSessionsForIdentity(
        stripe,
        {
          userId,
          deviceId,
          customerId,
          customerEmail: billingEmail,
        }
      );

      const reusableSession = openSessionsForIdentity.find(
        (session) =>
          matchesCheckoutSessionSelection(
            session,
            checkoutPlan,
            checkoutPlatform
          ) && !!session.url
      );

      if (reusableSession?.url) {
        if (openSessionsForIdentity.length > 1) {
          await expireOpenCheckoutSessions(
            stripe,
            openSessionsForIdentity,
            reusableSession.id
          );
        }

        console.log(
          `[Checkout] Reusing open checkout session ${reusableSession.id} for ${
            userId || deviceId || billingEmail || "unknown identity"
          }.`
        );

        return NextResponse.json({
          url: reusableSession.url,
          reusedExistingSession: true,
        });
      }

      if (openSessionsForIdentity.length > 0) {
        const expiredSessionIds = await expireOpenCheckoutSessions(
          stripe,
          openSessionsForIdentity
        );

        if (expiredSessionIds.length > 0) {
          console.log(
            `[Checkout] Expired stale open checkout sessions: ${expiredSessionIds.join(
              ", "
            )}`
          );
        }
      }
    } catch (error) {
      console.error(
        "[Checkout] Failed to reconcile open checkout sessions before creating a new one:",
        error
      );
    }

    // Idempotency key: same user+plan within same minute returns same session (avoids duplicate sessions on double-click)
    const idempotencyIdentity =
      userId || deviceId || customerId || `anon-${randomUUID()}`;
    const idempotencyKey = `${idempotencyIdentity}-${checkoutPlatform}-${checkoutPlan}-${Math.floor(Date.now() / 60000)}`;
    const session = await stripe.checkout.sessions.create(sessionConfig, {
      idempotencyKey,
    });

    // Server-side CAPI: InitiateCheckout (redundant with browser pixel for better match quality)
    try {
      await sendInitiateCheckoutEvent({
        eventId: initiateCheckoutEventId || generateEventId("ic_srv"),
        email: billingEmail,
        value: getCheckoutValue(checkoutPlan),
        currency: "USD",
        plan: checkoutPlan,
        sourceUrl: metaSourceUrl || request.nextUrl.origin,
        externalId: userId || deviceId,
        fbc: metaFbc,
        fbp: metaFbp,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        utm_term: utmTerm,
        utm_content: utmContent,
        mc_flow: mcFlow,
        mc_subscriber_id: mcSubscriberId,
        fbclid: fbclid,
      });
    } catch (capiErr) {
      console.error("CAPI InitiateCheckout error (non-fatal):", capiErr);
    }

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

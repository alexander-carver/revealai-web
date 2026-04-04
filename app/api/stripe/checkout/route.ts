import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { sendInitiateCheckoutEvent, generateEventId } from "@/lib/meta-capi";
import {
  introCouponIdForPlatform,
  resolveCheckoutPriceId,
  resolveCheckoutProductId,
  type CheckoutPlatform,
  type CheckoutPlan,
} from "@/lib/stripe-plan-config";
import { getCheckoutValue, PUBLIC_PRICING } from "@/lib/pricing";
import { getStripe } from "@/lib/stripe-server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    const { plan, userId, email, deviceId, affiliateRef, platform } =
      await request.json();
    const checkoutPlan = plan as CheckoutPlan;
    const checkoutPlatform: CheckoutPlatform =
      platform === "mobile" ? "mobile" : "web";

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
    const isTestMode = process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_");
    
    const configuredPriceId = resolveCheckoutPriceId(checkoutPlan, checkoutPlatform);
    const configuredProductId = resolveCheckoutProductId(checkoutPlan, checkoutPlatform);
    
    // Log which product ID is being used for debugging
    console.log(
      `[Checkout] Platform: ${checkoutPlatform}, Plan: ${checkoutPlan}, Price ID: ${configuredPriceId}, Product ID: ${configuredProductId}`
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

    // For abandoned_trial: use the configured weekly product with a one-time intro coupon.
    let abandonedTrialCouponId: string | undefined;
    if (checkoutPlan === "abandoned_trial") {
      try {
        const weeklyPriceId = resolveCheckoutPriceId("weekly", checkoutPlatform);
        const weeklyProductId = resolveCheckoutProductId("weekly", checkoutPlatform);
        if (weeklyPriceId) {
          priceId = weeklyPriceId;
        } else if (weeklyProductId) {
          const weeklyProduct = await stripe.products.retrieve(weeklyProductId);
          priceId = weeklyProduct.default_price as string;
        } else {
          throw new Error(`Missing weekly pricing for ${checkoutPlatform}`);
        }
        
        const COUPON_ID = introCouponIdForPlatform(checkoutPlatform);
        try {
          await stripe.coupons.retrieve(COUPON_ID);
        } catch {
          await stripe.coupons.create({
            id: COUPON_ID,
            amount_off: 500,
            currency: "usd",
            duration: "once",
            name: "Introductory Offer - First Week $1.99",
          });
        }
        abandonedTrialCouponId = COUPON_ID;
        console.log(
          `[Checkout] abandoned_trial: using ${checkoutPlatform} weekly product with intro coupon`
        );
      } catch (error) {
        console.error("[Checkout] Error setting up abandoned trial coupon:", error);
        if (!priceId && product?.default_price) {
          priceId = product.default_price as string;
        }
      }
    }

    // Get user email if userId provided
    let customerEmail = email;
    if (userId && !customerEmail) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      customerEmail = userData?.user?.email;
    }

    // Try to find or create Stripe customer for returning customers
    let customerId: string | undefined;
    if (customerEmail) {
      try {
        // Search for existing customer by email
        const existingCustomers = await stripe.customers.list({
          email: customerEmail,
          limit: 1,
        });
        
        if (existingCustomers.data.length > 0) {
          customerId = existingCustomers.data[0].id;
          
          // Check if this customer already has an active subscription
          // This prevents accidental double-subscriptions (e.g. user clicks subscribe twice)
          try {
            const existingSubscriptions = await stripe.subscriptions.list({
              customer: customerId,
              status: "active",
              limit: 1,
            });
            
            if (existingSubscriptions.data.length > 0) {
              const existingSub = existingSubscriptions.data[0];
              console.log(`[Checkout] Customer ${customerId} already has active subscription: ${existingSub.id}. Redirecting to success.`);
              
              // Return a special response that tells the client the user already has a subscription
              // The frontend can redirect to success page or show appropriate message
              return NextResponse.json({
                url: `${request.nextUrl.origin}/checkout-success?already_subscribed=true`,
                alreadySubscribed: true,
                message: "You already have an active subscription!",
              });
            }
          } catch (error) {
            console.error("Error checking existing subscriptions:", error);
            // Continue with checkout if we can't check
          }
        }
      } catch (error) {
        console.error("Error finding customer:", error);
        // Continue without customer
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
      // Apply coupon for abandoned_trial (first invoice only)
      ...(abandonedTrialCouponId && { discounts: [{ coupon: abandonedTrialCouponId }] }),
      // Use existing customer if found, otherwise let Stripe create one
      ...(customerId && { customer: customerId }),
      // If no existing customer, pre-fill email (or Stripe will collect it)
      ...(!customerId && customerEmail && { customer_email: customerEmail }),
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
        ...(customerEmail && { email: customerEmail }),
        ...(deviceId && { deviceId }),
        ...(cleanAffiliateRef && { affiliate_ref: cleanAffiliateRef }),
      },
      subscription_data: {
        // Main yearly and abandoned-checkout annual offer both start with a 3-day free trial.
        ...((checkoutPlan === "yearly" || checkoutPlan === "free_trial") && {
          trial_period_days: PUBLIC_PRICING.freeTrialDays,
        }),
        metadata: {
          ...(cleanAffiliateRef && { affiliate_ref: cleanAffiliateRef }),
        },
      },
    };

    // Idempotency key: same user+plan within same minute returns same session (avoids duplicate sessions on double-click)
    const idempotencyKey = `${userId || deviceId || "anon"}-${checkoutPlatform}-${checkoutPlan}-${Math.floor(Date.now() / 60000)}`;
    const session = await stripe.checkout.sessions.create(sessionConfig, {
      idempotencyKey,
    });

    // Server-side CAPI: InitiateCheckout (redundant with browser pixel for better match quality)
    try {
      await sendInitiateCheckoutEvent({
        eventId: generateEventId("ic_srv"),
        email: customerEmail || undefined,
        value: getCheckoutValue(checkoutPlan),
        currency: "USD",
        plan: checkoutPlan,
        sourceUrl: request.nextUrl.origin,
        externalId: userId || deviceId,
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

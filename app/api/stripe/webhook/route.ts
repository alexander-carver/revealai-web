import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import {
  ensureDeviceAuthUser,
  ensureEmailAuthUser,
  findAuthUserByEmail,
} from "@/lib/auth-admin";
import { getBillingCustomerEmail } from "@/lib/customer-email";
import { sendPurchaseEvent } from "@/lib/meta-capi";
import { sendCommissionEmail } from "@/lib/email";
import {
  inferTierFromProductId,
  normalizeTierForPlan,
} from "@/lib/stripe-plan-config";
import { getCheckoutValue } from "@/lib/pricing";
import { getServerStripeWebhookSecret } from "@/lib/stripe-env";
import { getStripe } from "@/lib/stripe-server";
import {
  expireOpenCheckoutSessions,
  listOpenCheckoutSessionsForIdentity,
} from "@/lib/stripe-checkout-sessions";
import {
  isAccessGrantingStripeSubscriptionStatus,
} from "@/lib/stripe-subscription-status";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const webhookSecret = getServerStripeWebhookSecret() || "";

type TrackedSubscriptionStatus = "active" | "canceled" | "past_due" | "unpaid";

function mapStripeSubscriptionStatus(
  status?: string | null
): TrackedSubscriptionStatus {
  if (isAccessGrantingStripeSubscriptionStatus(status)) {
    return "active";
  }

  if (status === "past_due" || status === "unpaid") {
    return status;
  }

  return "canceled";
}

function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const invoiceSubscription = (invoice as any).subscription;

  if (!invoiceSubscription) {
    return null;
  }

  return typeof invoiceSubscription === "string"
    ? invoiceSubscription
    : invoiceSubscription.id;
}

function getMetadataValue(
  metadata: Stripe.Metadata | null | undefined,
  key: string
) {
  const value = metadata?.[key]?.trim();
  return value || undefined;
}

// Disable body parsing for webhook
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  // Reject early if webhook secret is not configured (do not read/log body)
  if (!webhookSecret || webhookSecret.length === 0) {
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 503 }
    );
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "No signature" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log("Webhook event verified:", event.type);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        console.log("Processing checkout.session.completed");
        const session = event.data.object as Stripe.Checkout.Session;
        let userId = session.metadata?.userId || session.client_reference_id;
        const plan = session.metadata?.plan || "yearly";
        const deviceId = session.metadata?.deviceId;
        let customerEmail =
          session.customer_email ||
          session.customer_details?.email ||
          session.metadata?.email;
        const billingEmail = getBillingCustomerEmail(customerEmail);
        const stripeCustomerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id || null;
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id || null;

        let stripeSubscription: Stripe.Subscription | null = null;
        let currentPeriodEnd = new Date(
          Date.now() + 365 * 24 * 60 * 60 * 1000
        );
        let appSubscriptionStatus: TrackedSubscriptionStatus = "active";

        if (subscriptionId) {
          try {
            stripeSubscription = await stripe.subscriptions.retrieve(
              subscriptionId
            );
            appSubscriptionStatus = mapStripeSubscriptionStatus(
              stripeSubscription.status
            );

            const currentPeriodEndUnix = (stripeSubscription as any)
              .current_period_end;
            if (currentPeriodEndUnix) {
              currentPeriodEnd = new Date(currentPeriodEndUnix * 1000);
            }
          } catch (e) {
            console.error("Error fetching subscription:", e);
          }
        }

        console.log("Session data:", {
          userId,
          plan,
          customer: session.customer,
          deviceId,
          customerEmail: billingEmail || customerEmail,
          subscriptionId,
          appSubscriptionStatus,
        });

        if (billingEmail) {
          try {
            await ensureEmailAuthUser(supabase, billingEmail);
          } catch (billingEmailEnsureError) {
            console.error(
              "Webhook: failed to ensure billing email user:",
              billingEmailEnsureError
            );
          }
        }

        // If no userId in metadata, try to resolve by deviceId (like verify-session does)
        if (!userId && deviceId) {
          try {
            const ensuredDeviceUser = await ensureDeviceAuthUser(
              supabase,
              deviceId
            );
            userId = ensuredDeviceUser.userId;
            console.log("Webhook: resolved user by deviceId:", userId);
          } catch (deviceUserError) {
            console.error(
              "Webhook: failed to resolve user by deviceId:",
              deviceUserError
            );
          }
        }

        // If still no userId, try to resolve by customer email
        if (!userId && customerEmail) {
          try {
            const matchingUser = await findAuthUserByEmail(
              supabase,
              customerEmail
            );
            if (matchingUser) {
              userId = matchingUser.id;
              console.log("Webhook: resolved user by email:", userId);
            }
          } catch (userLookupError) {
            console.error(
              "Webhook: failed to resolve user by email:",
              userLookupError
            );
          }
        }

        if (!userId && customerEmail) {
          try {
            const ensuredEmailUser = await ensureEmailAuthUser(
              supabase,
              customerEmail
            );
            userId = ensuredEmailUser.userId;
            customerEmail = ensuredEmailUser.email;
            console.log("Webhook: created or found user by email:", userId);
          } catch (userCreationError) {
            console.error(
              "Webhook: failed to create user by email:",
              userCreationError
            );
          }
        }

        if (userId) {
          const subscriptionTier = normalizeTierForPlan(plan);

          const { error } = await supabase
            .from("subscriptions")
            .upsert({
              user_id: userId,
              stripe_customer_id: stripeCustomerId,
              stripe_subscription_id: subscriptionId,
              billing_provider: "stripe",
              whop_user_id: null,
              whop_membership_id: null,
              billing_manage_url: null,
              tier: subscriptionTier,
              status: appSubscriptionStatus,
              current_period_end: currentPeriodEnd.toISOString(),
              customer_email: billingEmail,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: "user_id",
            });

          if (error) {
            console.error("Error updating subscription:", error);
          } else {
            console.log("Subscription created for user:", userId);
          }

          if (appSubscriptionStatus === "active") {
            try {
              const openSessionsForIdentity =
                await listOpenCheckoutSessionsForIdentity(stripe, {
                  userId,
                  deviceId,
                  customerId: stripeCustomerId,
                  customerEmail,
                });

              if (openSessionsForIdentity.length > 0) {
                const expiredSessionIds = await expireOpenCheckoutSessions(
                  stripe,
                  openSessionsForIdentity,
                  session.id
                );

                if (expiredSessionIds.length > 0) {
                  console.log(
                    `Expired stale open checkout sessions after webhook completion: ${expiredSessionIds.join(
                      ", "
                    )}`
                  );
                }
              }
            } catch (openSessionError) {
              console.error(
                "Error expiring stale open checkout sessions after webhook completion:",
                openSessionError
              );
            }
          }

          // --- Affiliate referral tracking ---
          const affiliateRef = session.metadata?.affiliate_ref;
          if (affiliateRef && subscriptionId) {
            try {
              await supabase.from("affiliate_referrals").upsert({
                stripe_subscription_id: subscriptionId,
                stripe_customer_id: stripeCustomerId,
                affiliate_ref: affiliateRef,
                user_id: userId,
                commission_rate: 0.30,
                status: "active",
                created_at: new Date().toISOString(),
              }, {
                onConflict: "stripe_subscription_id",
              });
              console.log(`Affiliate referral recorded: ${affiliateRef} → subscription ${subscriptionId}`);

              // Mark recent clicks as converted (attribution tracking)
              await supabase
                .from("affiliate_clicks")
                .update({ converted: true })
                .eq("affiliate_ref", affiliateRef)
                .eq("converted", false)
                .gte("clicked_at", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
                .order("clicked_at", { ascending: false })
                .limit(1);
            } catch (affErr) {
              console.error("Error recording affiliate referral (non-fatal):", affErr);
            }
          }

          // --- Server-side Meta CAPI: Purchase ---
          try {
            const amount = session.amount_total ? session.amount_total / 100 : getCheckoutValue(plan);
            const currency = (session.currency || 'usd').toUpperCase();
            // Deterministic event_id: same as what /api/stripe/session returns to the browser
            const capiEventId = `pur_${session.id.replace('cs_', '').substring(0, 16)}`;
            const metaFbp = getMetadataValue(session.metadata, "meta_fbp");
            const metaFbc = getMetadataValue(session.metadata, "meta_fbc");
            const metaSourceUrl =
              getMetadataValue(session.metadata, "meta_source_url") ||
              session.success_url?.split('?')[0];

            await sendPurchaseEvent({
              eventId: capiEventId,
              email: customerEmail || '',
              value: amount,
              currency,
              transactionId: session.id,
              plan,
              sourceUrl: metaSourceUrl,
              externalId: userId || deviceId,
              fbc: metaFbc,
              fbp: metaFbp,
            });

          } catch (capiErr) {
            console.error("CAPI tracking error (non-fatal):", capiErr);
          }

        } else {
          console.log("Webhook: no userId resolved for checkout session. verify-session will handle it when user visits success page.");
        }
        break;
      }

      case "invoice.payment_succeeded":
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const invoiceSubId = getInvoiceSubscriptionId(invoice);

        // --- Affiliate commission tracking (30% recurring for life) ---
        if (invoiceSubId && invoice.amount_paid > 0) {
          try {
            const { data: referral } = await supabase
              .from("affiliate_referrals")
              .select("*")
              .eq("stripe_subscription_id", invoiceSubId)
              .eq("status", "active")
              .maybeSingle();

            if (referral) {
              const commissionAmount = Math.round(invoice.amount_paid * referral.commission_rate);
              const invoiceId = invoice.id;

              // Look up the affiliate's Connect account for automatic payouts
              const { data: affiliate } = await supabase
                .from("affiliates")
                .select("stripe_connect_account_id, status, email, name")
                .eq("ref_slug", referral.affiliate_ref)
                .eq("status", "active")
                .maybeSingle();

              let commissionStatus = "pending";
              let transferId: string | null = null;

              // Auto-transfer if affiliate has a connected payout account
              if (affiliate?.stripe_connect_account_id && commissionAmount > 0) {
                try {
                  const transfer = await stripe.transfers.create({
                    amount: commissionAmount,
                    currency: invoice.currency || "usd",
                    destination: affiliate.stripe_connect_account_id,
                    description: `30% affiliate commission – invoice ${invoiceId}`,
                    metadata: {
                      affiliate_ref: referral.affiliate_ref,
                      stripe_invoice_id: invoiceId,
                    },
                  });
                  commissionStatus = "paid";
                  transferId = transfer.id;
                  console.log(`Auto-transferred $${(commissionAmount / 100).toFixed(2)} to ${referral.affiliate_ref} (${transfer.id})`);
                } catch (transferErr: any) {
                  console.error(`Transfer failed for ${referral.affiliate_ref}:`, transferErr.message);
                  commissionStatus = "pending";
                }
              }

              // Idempotent insert keyed on invoice ID
              const { error: commErr } = await supabase
                .from("affiliate_commissions")
                .upsert({
                  stripe_invoice_id: invoiceId,
                  stripe_subscription_id: invoiceSubId,
                  affiliate_ref: referral.affiliate_ref,
                  invoice_amount_cents: invoice.amount_paid,
                  commission_amount_cents: commissionAmount,
                  commission_rate: referral.commission_rate,
                  currency: invoice.currency || "usd",
                  status: commissionStatus,
                  ...(transferId && { stripe_transfer_id: transferId }),
                  ...(commissionStatus === "paid" && { paid_at: new Date().toISOString() }),
                  created_at: new Date().toISOString(),
                }, {
                  onConflict: "stripe_invoice_id",
                });

              if (commErr) {
                console.error("Error recording affiliate commission:", commErr);
              } else {
                console.log(`Affiliate commission recorded: ${referral.affiliate_ref} earns $${(commissionAmount / 100).toFixed(2)} from invoice ${invoiceId} [${commissionStatus}]`);

                // --- Send commission email notification ---
                if (commissionStatus === "paid" && affiliate?.email) {
                  try {
                    // Check if this is their first commission
                    const { count: previousCommissions } = await supabase
                      .from("affiliate_commissions")
                      .select("*", { count: "exact", head: true })
                      .eq("affiliate_ref", referral.affiliate_ref)
                      .lt("created_at", new Date().toISOString()); // Before now

                    const isFirstCommission = (previousCommissions || 0) === 0;

                    await sendCommissionEmail(
                      affiliate.email,
                      affiliate.name,
                      `$${(commissionAmount / 100).toFixed(2)}`,
                      isFirstCommission
                    );
                  } catch (emailErr: any) {
                    console.error("Error sending commission email (non-fatal):", emailErr.message);
                  }
                }
              }
            }
          } catch (affErr) {
            console.error("Affiliate commission tracking error (non-fatal):", affErr);
          }
        }

        break;
      }

      case "invoice.payment_failed":
      case "invoice.payment_action_required": {
        const invoice = event.data.object as Stripe.Invoice;
        const invoiceSubId = getInvoiceSubscriptionId(invoice);
        const stripeCustomerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id || null;

        if (!invoiceSubId) {
          console.log(
            `Skipping ${event.type} because invoice ${invoice.id} has no subscription`
          );
          break;
        }

        let invoiceSubscription: Stripe.Subscription | null = null;
        let nextStatus: TrackedSubscriptionStatus = "past_due";
        let nextTier: "weekly" | "yearly" | null = null;
        let nextPeriodEnd: string | null = null;

        try {
          invoiceSubscription = await stripe.subscriptions.retrieve(invoiceSubId);
          nextStatus = mapStripeSubscriptionStatus(invoiceSubscription.status);
          nextTier =
            inferTierFromProductId(
              invoiceSubscription.items.data[0]?.price?.product as
                | string
                | undefined
            ) ?? null;

          if ((invoiceSubscription as any).current_period_end) {
            nextPeriodEnd = new Date(
              (invoiceSubscription as any).current_period_end * 1000
            ).toISOString();
          }
        } catch (subscriptionError) {
          console.error(
            `Failed to retrieve subscription ${invoiceSubId} after ${event.type}:`,
            subscriptionError
          );
        }

        const initialLookup = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", invoiceSubId)
          .maybeSingle();

        let resolvedSubscriptionRow = initialLookup.data;
        let resolvedLookupError = initialLookup.error;

        if (!resolvedSubscriptionRow && !resolvedLookupError && stripeCustomerId) {
          const fallbackLookup = await supabase
            .from("subscriptions")
            .select("user_id")
            .eq("stripe_customer_id", stripeCustomerId)
            .maybeSingle();

          resolvedSubscriptionRow = fallbackLookup.data;
          resolvedLookupError = fallbackLookup.error;
        }

        if (resolvedLookupError) {
          console.error(
            `Error locating tracked subscription for invoice ${invoice.id}:`,
            resolvedLookupError
          );
          break;
        }

        if (!resolvedSubscriptionRow) {
          console.log(
            `No tracked subscription found for invoice ${invoice.id} / subscription ${invoiceSubId}`
          );
          break;
        }

        const updatePayload: Record<string, string | null> = {
          billing_provider: "stripe",
          whop_user_id: null,
          whop_membership_id: null,
          billing_manage_url: null,
          status: nextStatus,
          updated_at: new Date().toISOString(),
        };

        if (nextTier) {
          updatePayload.tier = nextTier;
        }

        if (nextPeriodEnd) {
          updatePayload.current_period_end = nextPeriodEnd;
        }

        await supabase
          .from("subscriptions")
          .update(updatePayload)
          .eq("user_id", resolvedSubscriptionRow.user_id);

        console.log(
          `Marked subscription ${invoiceSubId} as ${nextStatus} after ${event.type}`
        );
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const subscriptionStatus = subscription.status;
        const trackedStatus = mapStripeSubscriptionStatus(subscriptionStatus);
        const currentProductId = subscription.items.data[0]?.price?.product as
          | string
          | undefined;
        const currentTier = inferTierFromProductId(currentProductId) ?? "yearly";

        const { data: subData, error: subscriptionLookupError } = await supabase
          .from("subscriptions")
          .select("user_id, stripe_subscription_id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (subscriptionLookupError) {
          console.error(
            "Error finding subscription record by customer id:",
            subscriptionLookupError
          );
        }

        if (subData) {
          if (trackedStatus === "active") {
            // Trialing and active both preserve access in our app.
            await supabase
              .from("subscriptions")
              .update({
                stripe_subscription_id: subscription.id,
                billing_provider: "stripe",
                whop_user_id: null,
                whop_membership_id: null,
                billing_manage_url: null,
                tier: currentTier,
                status: "active",
                current_period_end: new Date(
                  (subscription as any).current_period_end * 1000
                ).toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", subData.user_id);
            console.log(
              "Subscription activated/updated for user:",
              subData.user_id,
              "sub:",
              subscription.id,
              "status:",
              subscriptionStatus
            );
          } else if (trackedStatus === "past_due" || trackedStatus === "unpaid") {
            await supabase
              .from("subscriptions")
              .update({
                stripe_subscription_id: subscription.id,
                billing_provider: "stripe",
                whop_user_id: null,
                whop_membership_id: null,
                billing_manage_url: null,
                tier: currentTier,
                status: trackedStatus,
                current_period_end: new Date(
                  (subscription as any).current_period_end * 1000
                ).toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", subData.user_id);
            console.log(
              "Subscription requires payment update for user:",
              subData.user_id,
              "sub:",
              subscription.id,
              "status:",
              subscriptionStatus
            );
          } else {
            // Subscription no longer grants access — check if the customer has any
            // other active or trialing subscriptions before downgrading access.
            try {
              const customerSubscriptions = await stripe.subscriptions.list({
                customer: customerId,
                status: "all",
                limit: 10,
              });

              const remainingAccessSubscription =
                customerSubscriptions.data.find(
                  (candidate) =>
                    candidate.id !== subscription.id &&
                    isAccessGrantingStripeSubscriptionStatus(candidate.status)
                );

              if (remainingAccessSubscription) {
                await supabase
                  .from("subscriptions")
                  .update({
                    stripe_subscription_id: remainingAccessSubscription.id,
                    billing_provider: "stripe",
                    whop_user_id: null,
                    whop_membership_id: null,
                    billing_manage_url: null,
                    tier:
                      inferTierFromProductId(
                        remainingAccessSubscription.items.data[0]?.price
                          ?.product as
                          | string
                          | undefined
                      ) ?? currentTier,
                    status: "active",
                    current_period_end: new Date(
                      (remainingAccessSubscription as any).current_period_end *
                        1000
                    ).toISOString(),
                    updated_at: new Date().toISOString(),
                  })
                  .eq("user_id", subData.user_id);
                console.log(
                  "Switched to remaining access-granting subscription:",
                  remainingAccessSubscription.id,
                  "for user:",
                  subData.user_id
                );
              } else {
                // No other trialing/active subscriptions — actually cancel access.
                await supabase
                  .from("subscriptions")
                  .update({
                    status: "canceled",
                    current_period_end: new Date(
                      (subscription as any).current_period_end * 1000
                    ).toISOString(),
                    updated_at: new Date().toISOString(),
                  })
                  .eq("user_id", subData.user_id);
                console.log("All subscriptions canceled for user:", subData.user_id);
              }
            } catch (e) {
              console.error(
                "Error checking for other access-granting subscriptions:",
                e
              );
              // Fallback: only cancel if this is the tracked subscription
              if (subData.stripe_subscription_id === subscription.id) {
                await supabase
                  .from("subscriptions")
                  .update({
                    status: "canceled",
                    current_period_end: new Date(
                      (subscription as any).current_period_end * 1000
                    ).toISOString(),
                    updated_at: new Date().toISOString(),
                  })
                  .eq("user_id", subData.user_id);
              }
            }
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

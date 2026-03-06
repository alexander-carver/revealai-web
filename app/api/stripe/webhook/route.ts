import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { sendPurchaseEvent, sendStartTrialEvent, generateEventId } from "@/lib/meta-capi";
import { sendCommissionEmail } from "@/lib/email";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

// Disable body parsing for webhook
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
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
        const customerEmail = session.customer_email || 
                              session.customer_details?.email || 
                              session.metadata?.email;

        console.log("Session data:", { userId, plan, customer: session.customer, deviceId, customerEmail });

        // If no userId in metadata, try to resolve by deviceId (like verify-session does)
        if (!userId && deviceId) {
          const deviceEmail = `device_${deviceId}@revealai.device`;
          const { data: userData } = await supabase.auth.admin.listUsers();
          if (userData?.users) {
            const matchingUser = userData.users.find(
              u => u.email?.toLowerCase() === deviceEmail.toLowerCase()
            );
            if (matchingUser) {
              userId = matchingUser.id;
              console.log("Webhook: resolved user by deviceId:", userId);
            }
          }
        }

        // If still no userId, try to resolve by customer email
        if (!userId && customerEmail) {
          const { data: userData } = await supabase.auth.admin.listUsers();
          if (userData?.users) {
            const matchingUser = userData.users.find(
              u => u.email?.toLowerCase() === customerEmail.toLowerCase()
            );
            if (matchingUser) {
              userId = matchingUser.id;
              console.log("Webhook: resolved user by email:", userId);
            }
          }
        }

        if (userId) {
          // free_trial converts to weekly after trial, abandoned_trial also converts to weekly
          const subscriptionTier = plan === "weekly" || plan === "free_trial" || plan === "abandoned_trial" ? "weekly" : "yearly";
          
          // Get subscription details
          const subscriptionId = session.subscription as string;
          let currentPeriodEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
          
          if (subscriptionId) {
            try {
              const subscription = await stripe.subscriptions.retrieve(subscriptionId);
              currentPeriodEnd = new Date((subscription as any).current_period_end * 1000);
            } catch (e) {
              console.error("Error fetching subscription:", e);
            }
          }

          const { error } = await supabase
            .from("subscriptions")
            .upsert({
              user_id: userId,
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: subscriptionId,
              tier: subscriptionTier,
              status: "active",
              current_period_end: currentPeriodEnd.toISOString(),
              updated_at: new Date().toISOString(),
            }, {
              onConflict: "user_id",
            });

          if (error) {
            console.error("Error updating subscription:", error);
          } else {
            console.log("Subscription created for user:", userId);
          }

          // --- Affiliate referral tracking ---
          const affiliateRef = session.metadata?.affiliate_ref;
          if (affiliateRef && subscriptionId) {
            try {
              await supabase.from("affiliate_referrals").upsert({
                stripe_subscription_id: subscriptionId,
                stripe_customer_id: session.customer as string,
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

          // --- Server-side Meta CAPI: Purchase + StartTrial ---
          try {
            const amount = session.amount_total ? session.amount_total / 100 : (plan === 'yearly' ? 39.99 : plan === 'abandoned_trial' ? 1.99 : 9.99);
            const currency = (session.currency || 'usd').toUpperCase();
            // Deterministic event_id: same as what /api/stripe/session returns to the browser
            const capiEventId = `pur_${session.id.replace('cs_', '').substring(0, 16)}`;

            await sendPurchaseEvent({
              eventId: capiEventId,
              email: customerEmail || '',
              value: amount,
              currency,
              transactionId: session.id,
              plan,
              sourceUrl: session.success_url?.split('?')[0],
              externalId: userId || deviceId,
            });

            if (plan === 'free_trial' || plan === 'abandoned_trial') {
              await sendStartTrialEvent({
                eventId: generateEventId('st_srv'),
                email: customerEmail || '',
                value: amount,
                currency,
                plan,
                sourceUrl: session.success_url?.split('?')[0],
                externalId: userId || deviceId,
              });
            }
          } catch (capiErr) {
            console.error("CAPI tracking error (non-fatal):", capiErr);
          }

          // Safety net for abandoned_trial: if the subscription uses the old $1.99 product,
          // schedule the upgrade to $9.99/week immediately. New checkouts use the coupon approach
          // (so the product is already $9.99), but this catches any old-flow subscriptions.
          if (plan === "abandoned_trial" && subscriptionId) {
            try {
              const sub = await stripe.subscriptions.retrieve(subscriptionId);
              const lineItem = sub.items.data[0];
              const subProductId = lineItem?.price?.product as string;
              const abandonedTrialProductId = process.env.STRIPE_ABANDONED_TRIAL_PRODUCT_ID || "prod_TnGdDqDGvyBlhK";

              // Only upgrade if still on the old $1.99 product (not already using $9.99 via coupon)
              if (subProductId === abandonedTrialProductId && lineItem) {
                const weeklyProductId = process.env.STRIPE_WEEKLY_PRODUCT_ID || "prod_TexubYU0K47p6u";
                const weeklyProduct = await stripe.products.retrieve(weeklyProductId);
                const weeklyPriceId = weeklyProduct.default_price as string;

                if (weeklyPriceId) {
                  // Use subscription schedule for reliable automatic upgrade after first period
                  const schedule = await stripe.subscriptionSchedules.create({
                    from_subscription: subscriptionId,
                  });

                  const currentPhase = schedule.phases[0];
                  await stripe.subscriptionSchedules.update(schedule.id, {
                    end_behavior: "release",
                    phases: [
                      {
                        items: currentPhase.items.map((item: any) => ({
                          price: typeof item.price === "string" ? item.price : item.price.id,
                          quantity: item.quantity || 1,
                        })),
                        start_date: currentPhase.start_date,
                        end_date: currentPhase.end_date,
                      },
                      {
                        items: [{ price: weeklyPriceId, quantity: 1 }],
                      },
                    ],
                  });

                  console.log(`Created subscription schedule for abandoned_trial ${subscriptionId}: $1.99 → $9.99 after first period`);
                }
              }
            } catch (scheduleError: any) {
              console.error("Error creating abandoned trial schedule:", scheduleError);
              // Non-fatal: the customer.subscription.updated handler will also catch this
            }
          }
        } else {
          console.log("Webhook: no userId resolved for checkout session. verify-session will handle it when user visits success page.");
        }
        break;
      }

      case "invoice.payment_succeeded":
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const invoiceSubId = (invoice as any).subscription 
          ? (typeof (invoice as any).subscription === 'string' 
              ? (invoice as any).subscription 
              : (invoice as any).subscription.id)
          : null;

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

        // Handle upgrade from $1.99 to $9.99 for abandoned_trial subscriptions (legacy only)
        if (event.type === "invoice.payment_succeeded" && invoiceSubId && 
            (invoice.billing_reason === "subscription_cycle" || invoice.billing_reason === "subscription_create")) {
          try {
            const subscription = await stripe.subscriptions.retrieve(invoiceSubId);
            
            const lineItem = subscription.items.data[0];
            const productId = lineItem?.price?.product as string;
            const abandonedTrialProductId = process.env.STRIPE_ABANDONED_TRIAL_PRODUCT_ID || "prod_TnGdDqDGvyBlhK";
            
            if (productId === abandonedTrialProductId) {
              const hasUpgraded = subscription.metadata?.upgraded_to_weekly === "true";
              
              if (!hasUpgraded) {
                const weeklyProductId = process.env.STRIPE_WEEKLY_PRODUCT_ID || "prod_TexubYU0K47p6u";
                
                const weeklyProduct = await stripe.products.retrieve(weeklyProductId);
                const weeklyPriceId = weeklyProduct.default_price as string;
                
                if (weeklyPriceId) {
                  await stripe.subscriptions.update(invoiceSubId, {
                    items: [{
                      id: lineItem.id,
                      price: weeklyPriceId,
                    }],
                    proration_behavior: "none",
                    metadata: {
                      ...subscription.metadata,
                      upgraded_to_weekly: "true",
                    },
                  });
                  
                  console.log(`Scheduled upgrade for subscription ${invoiceSubId} from $1.99 to $9.99/week (effective next billing cycle)`);
                }
              }
            }
          } catch (error: any) {
            console.error("Error upgrading abandoned_trial subscription:", error);
          }
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const subscriptionStatus = subscription.status;

        // --- Abandoned trial auto-upgrade ---
        // Check if this is an active $1.99 abandoned_trial subscription that needs upgrading to $9.99/week.
        // This fires on every renewal (current_period_end changes), so it catches existing subscribers
        // who were stuck at $1.99 because the invoice.payment_succeeded webhook wasn't configured.
        if (subscriptionStatus === "active" && event.type === "customer.subscription.updated") {
          try {
            const lineItem = subscription.items.data[0];
            const subProductId = lineItem?.price?.product as string;
            const abandonedTrialProductId = process.env.STRIPE_ABANDONED_TRIAL_PRODUCT_ID || "prod_TnGdDqDGvyBlhK";

            if (subProductId === abandonedTrialProductId) {
              const hasUpgraded = subscription.metadata?.upgraded_to_weekly === "true";
              if (!hasUpgraded) {
                const weeklyProductId = process.env.STRIPE_WEEKLY_PRODUCT_ID || "prod_TexubYU0K47p6u";
                const weeklyProduct = await stripe.products.retrieve(weeklyProductId);
                const weeklyPriceId = weeklyProduct.default_price as string;

                if (weeklyPriceId && lineItem) {
                  await stripe.subscriptions.update(subscription.id, {
                    items: [{
                      id: lineItem.id,
                      price: weeklyPriceId,
                    }],
                    proration_behavior: "none",
                    metadata: {
                      ...subscription.metadata,
                      upgraded_to_weekly: "true",
                    },
                  });
                  console.log(`Auto-upgraded abandoned trial subscription ${subscription.id} from $1.99 to $9.99/week`);
                }
              }
            }
          } catch (upgradeError: any) {
            console.error("Error auto-upgrading abandoned trial:", upgradeError);
            // Don't fail the whole handler — continue with normal subscription update logic
          }
        }

        const { data: subData } = await supabase
          .from("subscriptions")
          .select("user_id, stripe_subscription_id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (subData) {
          if (subscriptionStatus === "active") {
            // Subscription became active — update to track it (use the most recently active one)
            await supabase
              .from("subscriptions")
              .update({
                stripe_subscription_id: subscription.id,
                status: "active",
                current_period_end: new Date(
                  (subscription as any).current_period_end * 1000
                ).toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", subData.user_id);
            console.log("Subscription activated/updated for user:", subData.user_id, "sub:", subscription.id);
          } else {
            // Subscription is being canceled/paused — check if customer has OTHER active subscriptions
            // This handles duplicate subscriptions: if one is canceled, the other keeps access alive
            try {
              const activeSubscriptions = await stripe.subscriptions.list({
                customer: customerId,
                status: "active",
                limit: 10,
              });

              if (activeSubscriptions.data.length > 0) {
                // Customer still has active subscriptions — switch to the most recent one
                const latestActive = activeSubscriptions.data[0];
                await supabase
                  .from("subscriptions")
                  .update({
                    stripe_subscription_id: latestActive.id,
                    status: "active",
                    current_period_end: new Date(
                      (latestActive as any).current_period_end * 1000
                    ).toISOString(),
                    updated_at: new Date().toISOString(),
                  })
                  .eq("user_id", subData.user_id);
                console.log("Switched to remaining active subscription:", latestActive.id, "for user:", subData.user_id);
              } else {
                // No other active subscriptions — actually cancel
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
              console.error("Error checking for other active subscriptions:", e);
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


import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

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

          // Safety net for abandoned_trial: if the subscription uses the old $1.99 product,
          // schedule the upgrade to $6.99/week immediately. New checkouts use the coupon approach
          // (so the product is already $6.99), but this catches any old-flow subscriptions.
          if (plan === "abandoned_trial" && subscriptionId) {
            try {
              const sub = await stripe.subscriptions.retrieve(subscriptionId);
              const lineItem = sub.items.data[0];
              const subProductId = lineItem?.price?.product as string;
              const abandonedTrialProductId = process.env.STRIPE_ABANDONED_TRIAL_PRODUCT_ID || "prod_TnGdDqDGvyBlhK";

              // Only upgrade if still on the $1.99 product (not already using $6.99 via coupon)
              if (subProductId === abandonedTrialProductId && lineItem) {
                const weeklyProductId = process.env.STRIPE_WEEKLY_PRODUCT_ID || "prod_Tn7ov8WD9p7Zty";
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

                  console.log(`Created subscription schedule for abandoned_trial ${subscriptionId}: $1.99 → $6.99 after first period`);
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

      case "invoice.payment_succeeded": {
        // Handle upgrade from $1.99 to $6.99 for abandoned_trial subscriptions
        const invoice = event.data.object as Stripe.Invoice;
        // invoice.subscription can be a string ID or a Subscription object
        const subscriptionId = (invoice as any).subscription 
          ? (typeof (invoice as any).subscription === 'string' 
              ? (invoice as any).subscription 
              : (invoice as any).subscription.id)
          : null;

        // Only process subscription invoices (not one-time payments)
        if (subscriptionId && (invoice.billing_reason === "subscription_cycle" || invoice.billing_reason === "subscription_create")) {
          try {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            
            // Check if this is an abandoned_trial subscription
            const lineItem = subscription.items.data[0];
            const productId = lineItem?.price?.product as string;
            const abandonedTrialProductId = process.env.STRIPE_ABANDONED_TRIAL_PRODUCT_ID || "prod_TnGdDqDGvyBlhK";
            
            if (productId === abandonedTrialProductId) {
              // Check if we've already upgraded this subscription
              const hasUpgraded = subscription.metadata?.upgraded_to_weekly === "true";
              
              if (!hasUpgraded) {
                // This is the first paid invoice for abandoned_trial, schedule upgrade to $6.99/week
                const weeklyProductId = process.env.STRIPE_WEEKLY_PRODUCT_ID || "prod_Tn7ov8WD9p7Zty";
                
                // Get the weekly product's price
                const weeklyProduct = await stripe.products.retrieve(weeklyProductId);
                const weeklyPriceId = weeklyProduct.default_price as string;
                
                if (weeklyPriceId) {
                  // Update subscription to use the weekly price starting next period
                  await stripe.subscriptions.update(subscriptionId, {
                    items: [{
                      id: lineItem.id,
                      price: weeklyPriceId,
                    }],
                    proration_behavior: "none", // Don't prorate, wait until next period
                    metadata: {
                      ...subscription.metadata,
                      upgraded_to_weekly: "true",
                    },
                  });
                  
                  console.log(`Scheduled upgrade for subscription ${subscriptionId} from $1.99 to $6.99/week (effective next billing cycle)`);
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
        // Check if this is an active $1.99 abandoned_trial subscription that needs upgrading to $6.99/week.
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
                const weeklyProductId = process.env.STRIPE_WEEKLY_PRODUCT_ID || "prod_Tn7ov8WD9p7Zty";
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
                  console.log(`Auto-upgraded abandoned trial subscription ${subscription.id} from $1.99 to $6.99/week`);
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


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
        const userId = session.metadata?.userId || session.client_reference_id;
        const plan = session.metadata?.plan || "yearly";

        console.log("Session data:", { userId, plan, customer: session.customer });

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

        const { data: subData } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (subData) {
          const status = subscription.status === "active" ? "active" : "canceled";

          await supabase
            .from("subscriptions")
            .update({
              status,
              current_period_end: new Date(
                (subscription as any).current_period_end * 1000
              ).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", subData.user_id);
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


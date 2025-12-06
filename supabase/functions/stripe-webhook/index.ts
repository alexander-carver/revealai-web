import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = await import("https://esm.sh/stripe@14.21.0?target=deno");

const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY") || "";
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const stripeClient = new stripe.Stripe(stripeSecret, {
  apiVersion: "2024-12-18.acacia",
  httpClient: stripe.Stripe.createFetchHttpClient(),
});

serve(async (req) => {
  try {
    console.log("Webhook received");
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      console.error("No signature in webhook request");
      return new Response(
        JSON.stringify({ error: "No signature" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await req.text();
    let event: stripe.Stripe.Event;

    try {
      event = stripeClient.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      );
      console.log("Webhook event verified:", event.type);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return new Response(
        JSON.stringify({ error: `Webhook Error: ${err.message}` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    switch (event.type) {
      case "checkout.session.completed": {
        console.log("Processing checkout.session.completed");
        const session = event.data.object as stripe.Stripe.Checkout.Session;
        const userId = session.metadata?.userId || session.client_reference_id;
        const plan = session.metadata?.plan || "yearly";
        const customerEmail = session.customer_email || session.metadata?.email;
        const customerId = session.customer as string;

        console.log("Checkout session data:", {
          userId,
          plan,
          customerEmail,
          customerId,
          subscriptionId: session.subscription,
        });

        const subscriptionTier = plan === "weekly" ? "weekly" : "yearly";
        
        // Get subscription details from Stripe
        const subscriptionId = session.subscription as string;
        let subscription;
        if (subscriptionId) {
          subscription = await stripeClient.subscriptions.retrieve(subscriptionId);
          console.log("Retrieved subscription:", subscription.id);
        }

        if (userId) {
          // User was signed in - create subscription directly
          console.log("Creating subscription for user:", userId);
          const { error } = await supabase
            .from("subscriptions")
            .upsert({
              user_id: userId,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              tier: subscriptionTier,
              status: "active",
              current_period_end: subscription
                ? new Date(subscription.current_period_end * 1000).toISOString()
                : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            }, {
              onConflict: "user_id",
            });

          if (error) {
            console.error("Error updating subscription:", error);
            return new Response(
              JSON.stringify({ error: error.message }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }
          console.log("Subscription created successfully for user:", userId);
        } else if (customerEmail) {
          // Guest checkout - store subscription with email for later linking
          // We'll create a temporary record that can be linked when user signs in
          console.log("Guest checkout - storing subscription with email:", customerEmail);
          
          // Try to find user by email
          const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
          const matchingUser = userData?.users.find(u => u.email === customerEmail);
          
          if (matchingUser) {
            // User exists - link subscription
            console.log("Found existing user, linking subscription:", matchingUser.id);
            const { error } = await supabase
              .from("subscriptions")
              .upsert({
                user_id: matchingUser.id,
                stripe_customer_id: customerId,
                stripe_subscription_id: subscriptionId,
                tier: subscriptionTier,
                status: "active",
                current_period_end: subscription
                  ? new Date(subscription.current_period_end * 1000).toISOString()
                  : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                updated_at: new Date().toISOString(),
              }, {
                onConflict: "user_id",
              });

            if (error) {
              console.error("Error linking subscription to existing user:", error);
            } else {
              console.log("Subscription linked to existing user:", matchingUser.id);
            }
          } else {
            // Store in a pending_subscriptions table or use metadata
            // For now, we'll store it with a placeholder and link it when user signs in
            // The checkout success page will handle linking when user signs in
            console.log("No existing user found - subscription will be linked on sign-in");
          }
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as stripe.Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by customer ID
        const { data: subData, error: findError } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (findError) {
          console.error("Error finding subscription:", findError);
          break;
        }

        if (subData) {
          const status = subscription.status === "active" ? "active" : "canceled";
          
          // Determine tier from subscription items
          const priceId = subscription.items.data[0]?.price.id;
          const weeklyProductId = Deno.env.get("STRIPE_WEEKLY_PRODUCT_ID");
          const yearlyProductId = Deno.env.get("STRIPE_YEARLY_PRODUCT_ID");
          
          if (!weeklyProductId || !yearlyProductId) {
            console.error("Missing STRIPE_WEEKLY_PRODUCT_ID or STRIPE_YEARLY_PRODUCT_ID");
          }
          
          // Get product ID from price
          let tier = "yearly"; // default
          if (priceId) {
            const price = await stripeClient.prices.retrieve(priceId);
            if (price.product === weeklyProductId) {
              tier = "weekly";
            } else if (price.product === yearlyProductId) {
              tier = "yearly";
            }
          }

          const { error: updateError } = await supabase
            .from("subscriptions")
            .update({
              status,
              tier,
              current_period_end: new Date(
                subscription.current_period_end * 1000
              ).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", subData.user_id);

          if (updateError) {
            console.error("Error updating subscription:", updateError);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Webhook handler error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});


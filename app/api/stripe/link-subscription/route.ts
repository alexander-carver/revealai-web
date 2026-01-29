import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { getSessionFromRequest } from "@/lib/auth-server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const sessionResult = await getSessionFromRequest(request);
    if (sessionResult.error) {
      return NextResponse.json(
        { error: sessionResult.error.message },
        { status: sessionResult.error.status }
      );
    }
    const userId = sessionResult.user.id;

    const { email, sessionId } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Missing email" },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // If we have a session ID, get the checkout session from Stripe
    let customerId: string | undefined;
    let subscriptionId: string | undefined;
    let plan: string | undefined;

    if (sessionId) {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        customerId = session.customer as string;
        subscriptionId = session.subscription as string;
        plan = session.metadata?.plan || "yearly";
      } catch (error) {
        console.error("Error retrieving checkout session:", error);
      }
    }

    // If we don't have customer ID from session, try to find customer by email
    if (!customerId && email) {
      try {
        const customers = await stripe.customers.list({
          email,
          limit: 1,
        });
        if (customers.data.length > 0) {
          customerId = customers.data[0].id;
          // Get the most recent subscription for this customer
          const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            limit: 1,
            status: "active",
          });
          if (subscriptions.data.length > 0) {
            subscriptionId = subscriptions.data[0].id;
            const priceId = subscriptions.data[0].items.data[0]?.price.id;
            if (priceId) {
              const price = await stripe.prices.retrieve(priceId);
              const weeklyProductId = process.env.STRIPE_WEEKLY_PRODUCT_ID;
              plan = price.product === weeklyProductId ? "weekly" : "yearly";
            }
          }
        }
      } catch (error) {
        console.error("Error finding customer by email:", error);
      }
    }

    if (!customerId || !subscriptionId) {
      return NextResponse.json(
        { error: "Could not find subscription for this email" },
        { status: 404 }
      );
    }

    // Get subscription details
    const subscription = await stripe.subscriptions.retrieve(subscriptionId) as Stripe.Subscription;
    const subscriptionTier = plan === "weekly" ? "weekly" : "yearly";

    // Link subscription to user
    const { error } = await supabase
      .from("subscriptions")
      .upsert({
        user_id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        tier: subscriptionTier,
        status: "active",
        current_period_end: (subscription as any).current_period_end 
          ? new Date((subscription as any).current_period_end * 1000).toISOString()
          : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id",
      });

    if (error) {
      console.error("Error linking subscription:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Link subscription error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to link subscription" },
      { status: 500 }
    );
  }
}


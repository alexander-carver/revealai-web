import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userId, email } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing sessionId" },
        { status: 400 }
      );
    }

    console.log("Verifying session:", sessionId, "for user:", userId || "unknown", "email:", email || "unknown");

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    console.log("Session status:", session.status, session.payment_status);
    console.log("Session customer email:", session.customer_email);
    console.log("Session metadata:", session.metadata);

    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Payment not completed", status: session.payment_status },
        { status: 400 }
      );
    }

    // Get the user ID - either from parameter, metadata, client_reference_id, or look up by email
    let finalUserId = userId || session.metadata?.userId || session.client_reference_id;
    
    // If we still don't have a userId, try to find the user by email
    if (!finalUserId) {
      const customerEmail = email || session.customer_email || session.metadata?.email;
      
      if (customerEmail) {
        console.log("Looking up user by email:", customerEmail);
        // Use admin API to find user by email
        const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
        
        if (!userError && userData?.users) {
          const matchingUser = userData.users.find(u => u.email === customerEmail);
          if (matchingUser) {
            finalUserId = matchingUser.id;
            console.log("Found user by email:", finalUserId);
          }
        }
      }
    }

    if (!finalUserId) {
      return NextResponse.json(
        { error: "Could not determine user. Please make sure you're signed in with the same email used for payment." },
        { status: 400 }
      );
    }

    // Get subscription details - handle both expanded and non-expanded cases
    let subscriptionId: string | null = null;
    let currentPeriodEnd: Date;

    // Check if subscription is expanded (object) or just an ID (string)
    if (session.subscription) {
      if (typeof session.subscription === 'string') {
        subscriptionId = session.subscription;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        currentPeriodEnd = new Date((subscription as any).current_period_end * 1000);
      } else {
        // Subscription is already expanded
        const expandedSub = session.subscription as Stripe.Subscription;
        subscriptionId = expandedSub.id;
        currentPeriodEnd = new Date((expandedSub as any).current_period_end * 1000);
      }
    } else {
      // Default to 1 year if no subscription (one-time payment)
      currentPeriodEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    }

    // Determine plan from metadata or default
    const plan = session.metadata?.plan || "yearly";
    const tier = plan === "weekly" ? "weekly" : "yearly";

    console.log("Creating subscription for user:", finalUserId, "tier:", tier);

    // Upsert subscription
    const { data, error } = await supabase
      .from("subscriptions")
      .upsert({
        user_id: finalUserId,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: subscriptionId || null,
        tier,
        status: "active",
        current_period_end: currentPeriodEnd.toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating subscription:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    console.log("Subscription created/updated:", data);

    return NextResponse.json({
      success: true,
      subscription: data,
    });
  } catch (error: any) {
    console.error("Verify session error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify session" },
      { status: 500 }
    );
  }
}


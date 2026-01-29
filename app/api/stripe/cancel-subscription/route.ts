import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { getSessionFromRequest } from "@/lib/auth-server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
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

    const { questionnaire } = await request.json();

    if (!questionnaire || !Array.isArray(questionnaire) || questionnaire.length !== 5) {
      return NextResponse.json(
        { error: "Questionnaire must contain 5 questions and answers" },
        { status: 400 }
      );
    }

    // Validate all answers meet minimum character requirement
    const MIN_CHARACTERS = 25;
    for (const item of questionnaire) {
      if (!item.answer || item.answer.length < MIN_CHARACTERS) {
        return NextResponse.json(
          { error: `All answers must be at least ${MIN_CHARACTERS} characters long` },
          { status: 400 }
        );
      }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's subscription
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("stripe_subscription_id, stripe_customer_id")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (subError || !subscription?.stripe_subscription_id) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 }
      );
    }

    // Store cancellation questionnaire in database (optional - you might want to create a table for this)
    // For now, we'll just log it and cancel the subscription
    
    console.log("Cancellation questionnaire submitted:", {
      userId,
      questionnaire,
      subscriptionId: subscription.stripe_subscription_id,
    });

    // Cancel the subscription in Stripe (cancels at period end)
    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    // Note: Status stays "active" until period ends
    // Webhook will update status when subscription actually ends
    await supabase
      .from("subscriptions")
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    return NextResponse.json({
      success: true,
      message: "Subscription canceled successfully",
    });
  } catch (error: any) {
    console.error("Cancel subscription error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}


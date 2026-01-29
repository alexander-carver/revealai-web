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

    // Get user's subscription to find Stripe customer ID
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (subError || !subscription?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 }
      );
    }

    // Create Stripe customer portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${request.nextUrl.origin}/settings`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Customer portal error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create portal session" },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSessionFromRequest } from "@/lib/auth-server";
import { getStripe } from "@/lib/stripe-server";
import { getWhopClient } from "@/lib/whop-server";

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

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select(
        "billing_provider, billing_manage_url, whop_membership_id, stripe_customer_id"
      )
      .eq("user_id", sessionResult.user.id)
      .maybeSingle();

    if (subError || !subscription) {
      return NextResponse.json(
        { error: "No billing profile found" },
        { status: 404 }
      );
    }

    if (subscription.billing_provider === "whop") {
      if (subscription.billing_manage_url) {
        return NextResponse.json({ url: subscription.billing_manage_url });
      }

      if (!subscription.whop_membership_id) {
        return NextResponse.json(
          { error: "No Whop membership found for this account" },
          { status: 404 }
        );
      }

      const whop = getWhopClient();
      const membership = await whop.memberships.retrieve(
        subscription.whop_membership_id
      );

      if (!membership.manage_url) {
        return NextResponse.json(
          { error: "Whop did not return a management URL for this membership" },
          { status: 404 }
        );
      }

      await supabase
        .from("subscriptions")
        .update({
          billing_manage_url: membership.manage_url,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", sessionResult.user.id);

      return NextResponse.json({ url: membership.manage_url });
    }

    if (!subscription.stripe_customer_id) {
      return NextResponse.json(
        { error: "No Stripe billing profile found" },
        { status: 404 }
      );
    }

    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${request.nextUrl.origin}/settings`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Billing management error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to open billing management" },
      { status: 500 }
    );
  }
}

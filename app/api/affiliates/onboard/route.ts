import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/affiliates/onboard?ref=SLUG
 * Generates a fresh Stripe Connect onboarding link for the affiliate.
 * Used when the creator visits for the first time or if their previous link expired.
 */
export async function GET(request: NextRequest) {
  try {
    const ref = request.nextUrl.searchParams.get("ref");

    if (!ref) {
      return NextResponse.json({ error: "Missing ref parameter" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: affiliate } = await supabase
      .from("affiliates")
      .select("*")
      .eq("ref_slug", ref)
      .maybeSingle();

    if (!affiliate || !affiliate.stripe_connect_account_id) {
      return NextResponse.json({ error: "Affiliate not found" }, { status: 404 });
    }

    const origin = request.nextUrl.origin;
    const accountLink = await stripe.accountLinks.create({
      account: affiliate.stripe_connect_account_id,
      refresh_url: `${origin}/api/affiliates/onboard?ref=${ref}&refresh=true`,
      return_url: `${origin}/api/affiliates/connect-return?ref=${ref}`,
      type: "account_onboarding",
    });

    return NextResponse.redirect(accountLink.url);
  } catch (error: any) {
    console.error("Onboard affiliate error:", error);
    return NextResponse.json(
      { error: error.message || "Internal error" },
      { status: 500 }
    );
  }
}

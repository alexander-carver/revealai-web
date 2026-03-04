import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * POST /api/affiliates/create
 * Creates a new affiliate: DB record + Stripe Connect Express account + onboarding link.
 *
 * Body: { name, email, ref_slug, commission_rate? }
 * Auth: AFFILIATE_API_SECRET in Authorization header
 *
 * Returns: { affiliate, affiliate_link, connect_onboarding_url }
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.AFFILIATE_API_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, email, ref_slug, commission_rate } = await request.json();

    if (!name || !email || !ref_slug) {
      return NextResponse.json(
        { error: "Missing required fields: name, email, ref_slug" },
        { status: 400 }
      );
    }

    const slug = ref_slug.toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (slug.length < 2) {
      return NextResponse.json(
        { error: "ref_slug must be at least 2 alphanumeric characters" },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if slug is already taken
    const { data: existing } = await supabase
      .from("affiliates")
      .select("id")
      .eq("ref_slug", slug)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: `ref_slug "${slug}" is already taken` },
        { status: 409 }
      );
    }

    // Create Stripe Connect Express account for the creator
    const connectAccount = await stripe.accounts.create({
      type: "express",
      email,
      metadata: {
        affiliate_ref: slug,
        affiliate_name: name,
      },
      capabilities: {
        transfers: { requested: true },
      },
    });

    // Save affiliate to DB
    const rate = commission_rate ?? 0.30;
    const { data: affiliate, error: dbError } = await supabase
      .from("affiliates")
      .insert({
        ref_slug: slug,
        name,
        email,
        stripe_connect_account_id: connectAccount.id,
        commission_rate: rate,
        status: "pending_onboarding",
      })
      .select()
      .single();

    if (dbError) {
      console.error("Error creating affiliate:", dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    // Generate Connect onboarding link
    const origin = request.nextUrl.origin;
    const accountLink = await stripe.accountLinks.create({
      account: connectAccount.id,
      refresh_url: `${origin}/api/affiliates/onboard?ref=${slug}&refresh=true`,
      return_url: `${origin}/api/affiliates/connect-return?ref=${slug}`,
      type: "account_onboarding",
    });

    const affiliateLink = `${origin}/?ref=${slug}`;

    return NextResponse.json({
      affiliate,
      affiliate_link: affiliateLink,
      connect_onboarding_url: accountLink.url,
      message: `Send the connect_onboarding_url to ${name} so they can set up payouts. Their affiliate link is: ${affiliateLink}`,
    });
  } catch (error: any) {
    console.error("Create affiliate error:", error);
    return NextResponse.json(
      { error: error.message || "Internal error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSessionFromRequest } from "@/lib/auth-server";
import { getStripe } from "@/lib/stripe-server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * POST /api/affiliates/signup
 * Self-service affiliate registration. Authenticated via Supabase session (Bearer token).
 *
 * Body: { name, ref_slug }
 * Returns: { affiliate, affiliate_link, connect_onboarding_url }
 */
export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    const session = await getSessionFromRequest(request);
    if (session.error) {
      return NextResponse.json({ error: session.error.message }, { status: session.error.status });
    }

    const user = session.user;
    const email = user.email?.toLowerCase();
    if (!email) {
      return NextResponse.json({ error: "No email associated with your account" }, { status: 400 });
    }

    const { name, ref_slug } = await request.json();

    if (!name || !ref_slug) {
      return NextResponse.json(
        { error: "Missing required fields: name, ref_slug" },
        { status: 400 }
      );
    }

    const slug = ref_slug.toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (slug.length < 3) {
      return NextResponse.json(
        { error: "Referral code must be at least 3 characters" },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Prevent duplicate signups
    const { data: existingUser } = await supabase
      .from("affiliates")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: "You already have an affiliate account" },
        { status: 409 }
      );
    }

    // Check if slug is taken
    const { data: existingSlug } = await supabase
      .from("affiliates")
      .select("id")
      .eq("ref_slug", slug)
      .maybeSingle();

    if (existingSlug) {
      return NextResponse.json(
        { error: `"${slug}" is already taken. Try a different referral code.` },
        { status: 409 }
      );
    }

    // Create Stripe Connect Express account
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

    // Insert affiliate with user_id already linked
    const { data: affiliate, error: dbError } = await supabase
      .from("affiliates")
      .insert({
        ref_slug: slug,
        name,
        email,
        user_id: user.id,
        stripe_connect_account_id: connectAccount.id,
        commission_rate: 0.30,
        status: "pending_onboarding",
      })
      .select()
      .single();

    if (dbError) {
      console.error("Error creating affiliate:", dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    // Generate Stripe Connect onboarding link
    const origin = request.nextUrl.origin;
    const accountLink = await stripe.accountLinks.create({
      account: connectAccount.id,
      refresh_url: `${origin}/api/affiliates/onboard?ref=${slug}&refresh=true`,
      return_url: `${origin}/api/affiliates/connect-return?ref=${slug}`,
      type: "account_onboarding",
    });

    return NextResponse.json({
      affiliate,
      affiliate_link: `${origin}/?ref=${slug}`,
      connect_onboarding_url: accountLink.url,
    });
  } catch (error: any) {
    console.error("Affiliate signup error:", error);
    return NextResponse.json(
      { error: error.message || "Internal error" },
      { status: 500 }
    );
  }
}

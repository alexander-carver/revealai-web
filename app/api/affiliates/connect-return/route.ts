import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/affiliates/connect-return?ref=SLUG
 * Stripe redirects the creator here after they complete Connect onboarding.
 * We check if their account is fully set up and update our DB accordingly.
 */
export async function GET(request: NextRequest) {
  try {
    const ref = request.nextUrl.searchParams.get("ref");

    if (!ref) {
      return new NextResponse(renderHTML("Error", "Missing affiliate reference."), {
        headers: { "Content-Type": "text/html" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: affiliate } = await supabase
      .from("affiliates")
      .select("*")
      .eq("ref_slug", ref)
      .maybeSingle();

    if (!affiliate || !affiliate.stripe_connect_account_id) {
      return new NextResponse(renderHTML("Error", "Affiliate not found."), {
        headers: { "Content-Type": "text/html" },
      });
    }

    // Check if Connect account is fully onboarded
    const account = await stripe.accounts.retrieve(affiliate.stripe_connect_account_id);
    const isReady = account.charges_enabled && account.payouts_enabled;

    if (isReady) {
      await supabase
        .from("affiliates")
        .update({
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("ref_slug", ref);

      const origin = request.nextUrl.origin;
      const affiliateLink = `${origin}/?ref=${ref}`;

      return new NextResponse(
        renderHTML(
          "You're all set!",
          `Your payout account is connected. You'll earn ${Math.round(affiliate.commission_rate * 100)}% commission on every sale, for life.<br/><br/>` +
          `<strong>Your affiliate link:</strong><br/>` +
          `<code style="background:#f3f4f6;padding:8px 16px;border-radius:8px;font-size:14px;display:inline-block;margin-top:8px;word-break:break-all;">${affiliateLink}</code><br/><br/>` +
          `Share this link with your audience. When someone subscribes through it, you earn commission on every payment they make — forever.`
        ),
        { headers: { "Content-Type": "text/html" } }
      );
    }

    // Not fully onboarded yet — send them back to complete it
    const origin = request.nextUrl.origin;
    const accountLink = await stripe.accountLinks.create({
      account: affiliate.stripe_connect_account_id,
      refresh_url: `${origin}/api/affiliates/onboard?ref=${ref}&refresh=true`,
      return_url: `${origin}/api/affiliates/connect-return?ref=${ref}`,
      type: "account_onboarding",
    });

    return NextResponse.redirect(accountLink.url);
  } catch (error: any) {
    console.error("Connect return error:", error);
    return new NextResponse(
      renderHTML("Something went wrong", "Please try again or contact support."),
      { headers: { "Content-Type": "text/html" } }
    );
  }
}

function renderHTML(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${title} — RevealAI Affiliates</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f9fafb; color: #111827; }
    .card { background: white; border-radius: 16px; padding: 48px; max-width: 520px; width: 100%; box-shadow: 0 4px 24px rgba(0,0,0,0.08); text-align: center; margin: 24px; }
    h1 { font-size: 24px; margin-bottom: 16px; }
    p { font-size: 16px; color: #4b5563; line-height: 1.6; }
    code { background: #f3f4f6; padding: 8px 16px; border-radius: 8px; font-size: 14px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${body}</p>
  </div>
</body>
</html>`;
}

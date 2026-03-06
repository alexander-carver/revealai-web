import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const ref = request.nextUrl.searchParams.get("ref");
    const secret = request.nextUrl.searchParams.get("secret");

    if (!ref) {
      return NextResponse.json({ error: "Missing ref parameter" }, { status: 400 });
    }

    // Simple shared-secret auth — replace with a proper auth check if you build a creator dashboard
    if (secret !== process.env.AFFILIATE_API_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Total referrals
    const { count: totalReferrals } = await supabase
      .from("affiliate_referrals")
      .select("*", { count: "exact", head: true })
      .eq("affiliate_ref", ref);

    // Active referrals
    const { count: activeReferrals } = await supabase
      .from("affiliate_referrals")
      .select("*", { count: "exact", head: true })
      .eq("affiliate_ref", ref)
      .eq("status", "active");

    // Commission totals
    const { data: commissions } = await supabase
      .from("affiliate_commissions")
      .select("commission_amount_cents, invoice_amount_cents, status")
      .eq("affiliate_ref", ref);

    let totalEarnedCents = 0;
    let totalGMVCents = 0;
    let pendingCents = 0;
    let paidCents = 0;
    let totalInvoices = 0;

    if (commissions) {
      for (const c of commissions) {
        totalEarnedCents += c.commission_amount_cents;
        totalGMVCents += c.invoice_amount_cents || 0;
        totalInvoices++;
        if (c.status === "pending") pendingCents += c.commission_amount_cents;
        if (c.status === "paid") paidCents += c.commission_amount_cents;
      }
    }

    // Recent commissions (last 20)
    const { data: recentCommissions } = await supabase
      .from("affiliate_commissions")
      .select("stripe_invoice_id, invoice_amount_cents, commission_amount_cents, commission_rate, currency, status, created_at")
      .eq("affiliate_ref", ref)
      .order("created_at", { ascending: false })
      .limit(20);

    return NextResponse.json({
      affiliate_ref: ref,
      referrals: {
        total: totalReferrals || 0,
        active: activeReferrals || 0,
      },
      commissions: {
        total_earned: `$${(totalEarnedCents / 100).toFixed(2)}`,
        total_earned_cents: totalEarnedCents,
        total_gmv: `$${(totalGMVCents / 100).toFixed(2)}`,
        total_gmv_cents: totalGMVCents,
        pending: `$${(pendingCents / 100).toFixed(2)}`,
        pending_cents: pendingCents,
        paid: `$${(paidCents / 100).toFixed(2)}`,
        paid_cents: paidCents,
        total_invoices: totalInvoices,
        commission_rate: "30%",
      },
      recent_commissions: recentCommissions || [],
    });
  } catch (error: any) {
    console.error("Affiliate stats error:", error);
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/affiliates/public-stats?ref=jane
 * Public endpoint for affiliates to view their own stats.
 * No authentication required - open by design so creators can bookmark and check anytime.
 */
export async function GET(request: NextRequest) {
  try {
    const ref = request.nextUrl.searchParams.get("ref");

    if (!ref) {
      return NextResponse.json({ error: "Missing ref parameter" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const origin = request.nextUrl.origin;

    // Get affiliate info
    const { data: affiliate } = await supabase
      .from("affiliates")
      .select("name, ref_slug, commission_rate, status, created_at")
      .eq("ref_slug", ref)
      .maybeSingle();

    if (!affiliate) {
      return NextResponse.json({ error: "Affiliate not found" }, { status: 404 });
    }

    // Click stats (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: clickStats } = await supabase
      .from("affiliate_clicks")
      .select("converted", { count: "exact" })
      .eq("affiliate_ref", ref)
      .gte("clicked_at", thirtyDaysAgo);

    const clicksTotal = clickStats?.length || 0;
    const clicksConverted = clickStats?.filter((c: any) => c.converted).length || 0;
    const conversionRate = clicksTotal > 0 ? ((clicksConverted / clicksTotal) * 100).toFixed(1) : "0.0";

    // All-time clicks
    const { count: allTimeClicks } = await supabase
      .from("affiliate_clicks")
      .select("*", { count: "exact", head: true })
      .eq("affiliate_ref", ref);

    // Referral stats
    const { count: totalReferrals } = await supabase
      .from("affiliate_referrals")
      .select("*", { count: "exact", head: true })
      .eq("affiliate_ref", ref);

    const { count: activeReferrals } = await supabase
      .from("affiliate_referrals")
      .select("*", { count: "exact", head: true })
      .eq("affiliate_ref", ref)
      .eq("status", "active");

    // Commission stats
    const { data: commissions } = await supabase
      .from("affiliate_commissions")
      .select("commission_amount_cents, status, created_at")
      .eq("affiliate_ref", ref)
      .order("created_at", { ascending: false });

    let totalEarnedCents = 0;
    let pendingCents = 0;
    let paidCents = 0;

    // Monthly earnings for chart (last 6 months)
    const monthlyData: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthlyData[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`] = 0;
    }

    if (commissions) {
      for (const c of commissions) {
        totalEarnedCents += c.commission_amount_cents;
        if (c.status === "pending") pendingCents += c.commission_amount_cents;
        if (c.status === "paid") paidCents += c.commission_amount_cents;

        // Monthly aggregation
        const date = new Date(c.created_at);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        if (monthlyData[key] !== undefined) {
          monthlyData[key] += c.commission_amount_cents;
        }
      }
    }

    // Recent commissions (last 10)
    const recentCommissions = (commissions || []).slice(0, 10).map((c: any) => ({
      commission_amount_cents: c.commission_amount_cents,
      status: c.status,
      created_at: c.created_at,
    }));

    return NextResponse.json({
      affiliate: {
        name: affiliate.name,
        ref_slug: affiliate.ref_slug,
        commission_rate: Math.round(affiliate.commission_rate * 100),
        status: affiliate.status,
        joined_at: affiliate.created_at,
        affiliate_link: `${origin}/?ref=${affiliate.ref_slug}`,
      },
      clicks: {
        last_30_days: clicksTotal,
        converted_last_30_days: clicksConverted,
        conversion_rate: `${conversionRate}%`,
        all_time: allTimeClicks || 0,
      },
      referrals: {
        total: totalReferrals || 0,
        active: activeReferrals || 0,
      },
      commissions: {
        total_earned: `$${(totalEarnedCents / 100).toFixed(2)}`,
        total_earned_cents: totalEarnedCents,
        pending: `$${(pendingCents / 100).toFixed(2)}`,
        pending_cents: pendingCents,
        paid: `$${(paidCents / 100).toFixed(2)}`,
        paid_cents: paidCents,
        total_payments: commissions?.length || 0,
      },
      monthly_earnings: Object.entries(monthlyData).map(([month, cents]) => ({
        month,
        amount: `$${(cents / 100).toFixed(2)}`,
        cents,
      })),
      recent_commissions: recentCommissions,
    });
  } catch (error: any) {
    console.error("Public stats error:", error);
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 });
  }
}

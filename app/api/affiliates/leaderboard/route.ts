import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/affiliates/leaderboard?secret=YOUR_SECRET
 * Returns leaderboard data for admin dashboard.
 */
export async function GET(request: NextRequest) {
  try {
    const secret = request.nextUrl.searchParams.get("secret");

    if (secret !== process.env.AFFILIATE_API_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current month start
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Top earners this month
    const { data: topEarners } = await supabase
      .from("affiliate_commissions")
      .select("affiliate_ref, commission_amount_cents, created_at")
      .gte("created_at", monthStart)
      .order("commission_amount_cents", { ascending: false });

    // Aggregate by affiliate
    const earningsMap = new Map<string, number>();
    topEarners?.forEach((c: any) => {
      const current = earningsMap.get(c.affiliate_ref) || 0;
      earningsMap.set(c.affiliate_ref, current + c.commission_amount_cents);
    });

    // Get affiliate names
    const affiliateRefs = Array.from(earningsMap.keys());
    const { data: affiliates } = await supabase
      .from("affiliates")
      .select("ref_slug, name")
      .in("ref_slug", affiliateRefs);

    const topEarnersList = affiliateRefs
      .map((ref) => ({
        ref_slug: ref,
        name: affiliates?.find((a: any) => a.ref_slug === ref)?.name || ref,
        earnings_cents: earningsMap.get(ref) || 0,
        earnings: `$${((earningsMap.get(ref) || 0) / 100).toFixed(2)}`,
      }))
      .sort((a, b) => b.earnings_cents - a.earnings_cents)
      .slice(0, 10);

    // Most referrals (all time)
    const { data: referrals } = await supabase
      .from("affiliate_referrals")
      .select("affiliate_ref");

    const referralCounts = new Map<string, number>();
    referrals?.forEach((r: any) => {
      const current = referralCounts.get(r.affiliate_ref) || 0;
      referralCounts.set(r.affiliate_ref, current + 1);
    });

    const referralRefs = Array.from(referralCounts.keys());
    const { data: referralAffiliates } = await supabase
      .from("affiliates")
      .select("ref_slug, name")
      .in("ref_slug", referralRefs);

    const mostReferralsList = referralRefs
      .map((ref) => ({
        ref_slug: ref,
        name: referralAffiliates?.find((a: any) => a.ref_slug === ref)?.name || ref,
        count: referralCounts.get(ref) || 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Highest conversion rates
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentClicks } = await supabase
      .from("affiliate_clicks")
      .select("affiliate_ref, converted")
      .gte("clicked_at", thirtyDaysAgo);

    const clickStats = new Map<string, { clicks: number; conversions: number }>();
    recentClicks?.forEach((c: any) => {
      const stats = clickStats.get(c.affiliate_ref) || { clicks: 0, conversions: 0 };
      stats.clicks++;
      if (c.converted) stats.conversions++;
      clickStats.set(c.affiliate_ref, stats);
    });

    const conversionRefs = Array.from(clickStats.keys()).filter(
      (ref) => (clickStats.get(ref)?.clicks || 0) >= 10 // Minimum 10 clicks for statistical relevance
    );

    const { data: conversionAffiliates } = await supabase
      .from("affiliates")
      .select("ref_slug, name")
      .in("ref_slug", conversionRefs);

    const highestConversionList = conversionRefs
      .map((ref) => {
        const stats = clickStats.get(ref)!;
        const rate = (stats.conversions / stats.clicks) * 100;
        return {
          ref_slug: ref,
          name: conversionAffiliates?.find((a: any) => a.ref_slug === ref)?.name || ref,
          conversion_rate: `${rate.toFixed(1)}%`,
          clicks: stats.clicks,
          conversions: stats.conversions,
        };
      })
      .sort((a, b) => parseFloat(b.conversion_rate) - parseFloat(a.conversion_rate))
      .slice(0, 10);

    return NextResponse.json({
      top_earners_this_month: topEarnersList,
      most_referrals_all_time: mostReferralsList,
      highest_conversion_rates: highestConversionList,
      updated_at: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Leaderboard error:", error);
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 });
  }
}

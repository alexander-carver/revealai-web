import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/affiliates/export?secret=YOUR_SECRET&type=commissions|referrals|all
 * Exports affiliate data as CSV for accounting/taxes.
 */
export async function GET(request: NextRequest) {
  try {
    const secret = request.nextUrl.searchParams.get("secret");
    const type = request.nextUrl.searchParams.get("type") || "all";

    if (secret !== process.env.AFFILIATE_API_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    let csv = "";
    let filename = "";

    if (type === "commissions" || type === "all") {
      // Export all commissions
      const { data: commissions } = await supabase
        .from("affiliate_commissions")
        .select("*")
        .order("created_at", { ascending: false });

      if (commissions && commissions.length > 0) {
        // CSV Header
        csv += "Affiliate Ref,Invoice ID,Amount (cents),Commission (cents),Rate,Currency,Status,Paid At,Created At\n";
        
        // CSV Rows
        for (const c of commissions) {
          csv += `${c.affiliate_ref},${c.stripe_invoice_id},${c.invoice_amount_cents},${c.commission_amount_cents},${c.commission_rate},${c.currency},${c.status},${c.paid_at || ""},${c.created_at}\n`;
        }
        
        filename = `affiliate-commissions-${new Date().toISOString().split("T")[0]}.csv`;
      } else {
        csv = "No commissions found.\n";
        filename = "affiliate-commissions-empty.csv";
      }
    } else if (type === "referrals") {
      // Export all referrals
      const { data: referrals } = await supabase
        .from("affiliate_referrals")
        .select("*")
        .order("created_at", { ascending: false });

      if (referrals && referrals.length > 0) {
        csv += "Affiliate Ref,Subscription ID,Customer ID,User ID,Commission Rate,Status,Created At\n";
        
        for (const r of referrals) {
          csv += `${r.affiliate_ref},${r.stripe_subscription_id},${r.stripe_customer_id},${r.user_id || ""},${r.commission_rate},${r.status},${r.created_at}\n`;
        }
        
        filename = `affiliate-referrals-${new Date().toISOString().split("T")[0]}.csv`;
      } else {
        csv = "No referrals found.\n";
        filename = "affiliate-referrals-empty.csv";
      }
    }

    // Return as downloadable CSV
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("Export error:", error);
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 });
  }
}

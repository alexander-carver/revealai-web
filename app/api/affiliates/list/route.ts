import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/affiliates/list?secret=YOUR_SECRET
 * Returns all affiliates with their links and onboarding status.
 */
export async function GET(request: NextRequest) {
  try {
    const secret = request.nextUrl.searchParams.get("secret");

    if (secret !== process.env.AFFILIATE_API_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const origin = request.nextUrl.origin;

    const { data: affiliates, error } = await supabase
      .from("affiliates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const result = (affiliates || []).map((a) => ({
      ...a,
      affiliate_link: `${origin}/?ref=${a.ref_slug}`,
      onboarding_link: a.status === "pending_onboarding"
        ? `${origin}/api/affiliates/onboard?ref=${a.ref_slug}`
        : null,
    }));

    return NextResponse.json({ affiliates: result });
  } catch (error: any) {
    console.error("List affiliates error:", error);
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 });
  }
}

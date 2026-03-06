import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/affiliates/check-slug?slug=xyz
 * Public endpoint for live referral code availability check.
 */
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug")?.toLowerCase().replace(/[^a-z0-9_-]/g, "");

  if (!slug || slug.length < 3) {
    return NextResponse.json({ available: false, reason: "Must be at least 3 characters" });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: existing } = await supabase
    .from("affiliates")
    .select("id")
    .eq("ref_slug", slug)
    .maybeSingle();

  return NextResponse.json({ available: !existing, slug });
}

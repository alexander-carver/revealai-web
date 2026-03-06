import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * POST /api/affiliates/track-click
 * Logs an affiliate link click for analytics.
 * Body: { ref, referrer, userAgent, screenResolution, language, timestamp }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ref, referrer, userAgent, screenResolution, language, timestamp } = body;

    if (!ref) {
      return NextResponse.json({ error: "Missing ref" }, { status: 400 });
    }

    // Get IP address (for fraud detection)
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : request.ip || "unknown";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Log the click
    await supabase.from("affiliate_clicks").insert({
      affiliate_ref: ref,
      ip_address: ip,
      referrer: referrer || null,
      user_agent: userAgent || null,
      screen_resolution: screenResolution || null,
      language: language || null,
      clicked_at: new Date(timestamp || Date.now()).toISOString(),
      converted: false, // Will be updated to true if they subscribe
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Track click error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

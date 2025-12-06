import { serve } from "https://deno.land/std@0.214.0/http/server.ts";

/* ======================= TEST FUNCTION - WEB (WITH CORS) ======================= */
/* This is a TEST function for web. Do not use in production! */

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
  "Access-Control-Max-Age": "86400",
};

const PLATFORMS = [
  { site: "twitter", display: "Twitter/X", urlTemplate: "https://twitter.com/{username}" },
  { site: "instagram", display: "Instagram", urlTemplate: "https://instagram.com/{username}" },
  { site: "facebook", display: "Facebook", urlTemplate: "https://facebook.com/{username}" },
  { site: "linkedin", display: "LinkedIn", urlTemplate: "https://linkedin.com/in/{username}" },
  { site: "github", display: "GitHub", urlTemplate: "https://github.com/{username}" },
  { site: "tiktok", display: "TikTok", urlTemplate: "https://tiktok.com/@{username}" },
  { site: "youtube", display: "YouTube", urlTemplate: "https://youtube.com/@{username}" },
  { site: "reddit", display: "Reddit", urlTemplate: "https://reddit.com/user/{username}" },
  { site: "pinterest", display: "Pinterest", urlTemplate: "https://pinterest.com/{username}" },
  { site: "snapchat", display: "Snapchat", urlTemplate: "https://snapchat.com/add/{username}" },
  { site: "twitch", display: "Twitch", urlTemplate: "https://twitch.tv/{username}" },
  { site: "medium", display: "Medium", urlTemplate: "https://medium.com/@{username}" },
];

serve(async (req) => {
  console.log("[TEST-username-search-web] ⚠️ TEST FUNCTION - WEB VERSION (WITH CORS)");

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const origin = req.headers.get("origin");
  const responseHeaders: Record<string, string> = {
    ...corsHeaders,
    "Content-Type": "application/json",
  };
  if (origin) {
    responseHeaders["Access-Control-Allow-Origin"] = origin;
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { ...responseHeaders, Allow: "POST" }
    });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return new Response("Invalid JSON", { status: 400, headers: responseHeaders });
  }

  const { username } = body;

  console.log("[TEST-username-search-web] Username:", username);

  if (!username || username.length < 2) {
    return new Response(JSON.stringify({
      error: "Username must be at least 2 characters",
      test: true
    }), {
      status: 400,
      headers: responseHeaders
    });
  }

  const startTime = Date.now();

  // TODO: Replace with actual username checking logic
  // For now, return test data
  const profiles = PLATFORMS.map((platform) => {
    const url = platform.urlTemplate.replace("{username}", username);
    const exists = Math.random() > 0.5; // Random for testing
    return {
      site: platform.site,
      display: platform.display,
      url,
      status: exists ? 200 : 404,
      exists,
      confidence: exists ? 0.85 : 0,
    };
  });

  const tookMs = Date.now() - startTime;

  return new Response(JSON.stringify({
    username,
    profiles,
    provider: "username-search",
    tookMs,
    test: true
  }), {
    status: 200,
    headers: responseHeaders
  });
});


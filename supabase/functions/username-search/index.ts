import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers - required for browser requests, ignored by mobile
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

// List of platforms to check
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
  // Handle CORS preflight (browsers only, mobile ignores this)
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Verify authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body = await req.json();
    const { username } = body;

    console.log("username-search called for:", username);

    if (!username || username.length < 2) {
      return new Response(
        JSON.stringify({ error: "Username must be at least 2 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const startTime = Date.now();

    // TODO: Replace with actual username checking logic
    // This could involve:
    // 1. Making HEAD requests to each platform
    // 2. Using a third-party username checking API
    // 3. Checking against a database of known usernames

    // For now, simulate checking by randomly marking some as found
    const profiles = await Promise.all(
      PLATFORMS.map(async (platform) => {
        const url = platform.urlTemplate.replace("{username}", username);
        
        // TODO: Replace this with actual checking logic
        // Example:
        /*
        try {
          const response = await fetch(url, { method: "HEAD" });
          const exists = response.status === 200;
          return {
            site: platform.site,
            display: platform.display,
            url,
            status: response.status,
            exists,
            confidence: exists ? 0.9 : 0,
          };
        } catch (e) {
          return {
            site: platform.site,
            display: platform.display,
            url,
            status: 0,
            exists: false,
            confidence: 0,
            error: e.message,
          };
        }
        */

        // Placeholder: randomly determine if username exists (for testing)
        const exists = Math.random() > 0.5;
        return {
          site: platform.site,
          display: platform.display,
          url,
          status: exists ? 200 : 404,
          exists,
          confidence: exists ? 0.85 : 0,
        };
      })
    );

    const tookMs = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        username,
        profiles,
        provider: "username-search",
        tookMs,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("username-search error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});


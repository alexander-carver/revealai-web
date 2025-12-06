import { serve } from "https://deno.land/std@0.214.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/* ======================= TEST FUNCTION - WEB (WITH CORS) ======================= */
/* This is a TEST function for web. Do not use in production! */

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
  "Access-Control-Max-Age": "86400",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

serve(async (req) => {
  console.log("[TEST-remove-from-search-web] ⚠️ TEST FUNCTION - WEB VERSION (WITH CORS)");

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

  const { userId, optOut, client, requestedAt } = body;

  console.log("[TEST-remove-from-search-web] UserId:", userId);
  console.log("[TEST-remove-from-search-web] OptOut:", optOut);
  console.log("[TEST-remove-from-search-web] Client:", client);

  if (!userId) {
    return new Response(JSON.stringify({
      error: "Missing required field: userId",
      test: true
    }), {
      status: 400,
      headers: responseHeaders
    });
  }

  // Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // TODO: Implement actual opt-out logic
  // For now, just acknowledge the request
  console.log(`[TEST-remove-from-search-web] User ${userId} opt-out status set to: ${optOut}`);

  return new Response(JSON.stringify({
    success: true,
    message: optOut 
      ? "You have been opted out of search results" 
      : "You are now visible in search results",
    userId,
    optOut,
    test: true
  }), {
    status: 200,
    headers: responseHeaders
  });
});


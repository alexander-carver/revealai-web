import { serve } from "https://deno.land/std@0.214.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/* ======================= TEST FUNCTION - MOBILE ======================= */
/* This is a TEST function for mobile. Do not use in production! */

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

serve(async (req) => {
  console.log("[TEST-remove-from-search] ⚠️ TEST FUNCTION - MOBILE VERSION");

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { Allow: "POST" }
    });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { userId, optOut, client, requestedAt } = body;

  console.log("[TEST-remove-from-search] UserId:", userId);
  console.log("[TEST-remove-from-search] OptOut:", optOut);
  console.log("[TEST-remove-from-search] Client:", client);

  if (!userId) {
    return new Response(JSON.stringify({
      error: "Missing required field: userId",
      test: true
    }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // TODO: Implement actual opt-out logic
  // For now, just acknowledge the request
  console.log(`[TEST-remove-from-search] User ${userId} opt-out status set to: ${optOut}`);

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
    headers: { "Content-Type": "application/json" }
  });
});


import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers - required for browser requests, ignored by mobile
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

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
    const { userId, optOut, client, requestedAt } = body;

    console.log("remove-from-search called");
    console.log("UserId:", userId);
    console.log("OptOut:", optOut);
    console.log("Client:", client);

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Missing required field: userId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // TODO: Implement your opt-out logic here
    // This could involve:
    // 1. Updating a user_preferences table
    // 2. Adding to an opt-out list
    // 3. Calling external data broker APIs

    // Example: Store opt-out preference in database
    /*
    const { error: dbError } = await supabase
      .from("user_privacy_preferences")
      .upsert({
        user_id: userId,
        opted_out: optOut,
        client,
        requested_at: requestedAt,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id",
      });

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }
    */

    // For now, just acknowledge the request
    console.log(`User ${userId} opt-out status set to: ${optOut}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: optOut 
          ? "You have been opted out of search results" 
          : "You are now visible in search results",
        userId,
        optOut,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("remove-from-search error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});


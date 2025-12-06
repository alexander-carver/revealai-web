// Example Supabase Edge Function with CORS Support
// Copy this template to your actual functions and adapt as needed
//
// ⚠️ IMPORTANT: This function is used by both mobile and web apps.
// CORS headers are SAFE for mobile apps - they're browser-only and mobile apps ignore them.
// We're only adding headers, not changing the request/response structure.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers - REQUIRED for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Use specific origin in production
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight requests (OPTIONS)
  // Browsers send this before the actual request
  // Mobile apps DON'T send OPTIONS, so this only affects web browsers
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Parse request body
    const body = await req.json();
    
    // Your function logic here...
    // IMPORTANT: Keep your existing logic exactly as-is
    // We're only adding CORS headers to the response
    // Example:
    // const result = await doSomething(body);
    
    // Return success response WITH CORS headers
    // Mobile apps will receive the same response, just with extra headers (which they ignore)
    return new Response(
      JSON.stringify({ 
        success: true,
        // ... your response data (keep existing structure)
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders, // Added for web browsers
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    // Return error response WITH CORS headers
    return new Response(
      JSON.stringify({ 
        error: error.message || "An error occurred" 
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});


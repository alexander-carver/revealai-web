import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers - required for browser requests, ignored by mobile
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

// Enformion API configuration
const ENFORMION_API_URL = Deno.env.get("ENFORMION_API_URL") || "https://api.enformion.com";
const ENFORMION_API_KEY = Deno.env.get("ENFORMION_API_KEY") || "";

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
    const { person, jurisdictions } = body;

    console.log("enformion-records called");
    console.log("Person:", JSON.stringify(person));

    if (!person || !person.firstName || !person.lastName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: firstName and lastName" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const startTime = Date.now();

    // TODO: Replace this with your actual Enformion Records API call
    // Example structure:
    /*
    const enformionResponse = await fetch(`${ENFORMION_API_URL}/records`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ENFORMION_API_KEY}`,
      },
      body: JSON.stringify({
        firstName: person.firstName,
        lastName: person.lastName,
        dob: person.dob,
        city: person.city,
        state: person.state,
        jurisdictions,
      }),
    });

    if (!enformionResponse.ok) {
      const errorText = await enformionResponse.text();
      throw new Error(`Enformion API error: ${errorText}`);
    }

    const data = await enformionResponse.json();
    const records = data.records || [];
    */

    // Placeholder response - replace with actual API results
    const records = [
      {
        id: "record-1",
        category: "Traffic",
        caseNumber: "TC-2023-001234",
        filedDate: "2023-06-15",
        status: "Closed",
        jurisdiction: `${person.city || "Austin"}, ${person.state || "TX"}`,
        description: "Minor traffic violation - speeding",
      },
      {
        id: "record-2",
        category: "Civil",
        caseNumber: "CV-2022-005678",
        filedDate: "2022-03-22",
        status: "Resolved",
        jurisdiction: `${person.state || "TX"} District Court`,
        description: "Small claims dispute",
      },
    ];

    const tookMs = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        records,
        provider: "enformion",
        tookMs,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("enformion-records error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});


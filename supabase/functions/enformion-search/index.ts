import { serve } from "https://deno.land/std@0.214.0/http/server.ts";

// CORS headers - required for browser requests, ignored by mobile
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
  "Access-Control-Max-Age": "86400", // 24 hours
};

const ENFORMION_ENDPOINT = (Deno.env.get("ENFORMION_BASE_URL") ?? "https://devapi.enformion.com").replace(/\/+$/, "");

const ENFORMION_AP_NAME = must("ENFORMION_API_KEY");

const ENFORMION_AP_PASSWORD = must("ENFORMION_API_SECRET");

const ENFORMION_CLIENT_TYPE = Deno.env.get("ENFORMION_CLIENT_TYPE") ?? "ios";

// Starter-safe Person Search includes: avoid pro-only record bundles by default
const PERSON_SEARCH_INCLUDES_STARTER = [
  "Addresses",
  "Akas",
  "PhoneNumbers",
  "EmailAddresses",
  "Relatives",
  "Associates",
  "Neighbors",
  "WorkPlace",
  "Indicators",
  "RelativesSummary",
  "AssociatesSummary",
];

type Operation =
  | "person_candidates"
  | "person_profile"
  | "reverse_phone"
  | "email_lookup"
  | "address_lookup";

serve(async (req) => {
  // Handle CORS preflight (browsers only, mobile ignores this)
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  // Get origin from request for CORS
  const origin = req.headers.get("origin");
  const responseHeaders: Record<string, string> = {
    ...corsHeaders,
    "Content-Type": "application/json",
  };
  
  // If origin is provided, use it (for better security in production)
  if (origin) {
    responseHeaders["Access-Control-Allow-Origin"] = origin;
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { 
      status: 405, 
      headers: { 
        ...responseHeaders,
        "Allow": "POST" 
      } 
    });
  }

  const body = await req.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return new Response("Invalid JSON", { 
      status: 400,
      headers: responseHeaders
    });
  }

  const { operation, ...payload } = body as Record<string, unknown>;

  if (!operation || typeof operation !== "string") {
    return new Response("Missing operation", { 
      status: 400,
      headers: responseHeaders
    });
  }

  console.log(`[enformion-search] Base URL: ${ENFORMION_ENDPOINT}`);
  console.log(`[enformion-search] Operation: ${operation}`);
  console.log(`[enformion-search] Payload:`, JSON.stringify(payload));

  try {
    switch (operation as Operation) {
      case "person_candidates":
        // Main API: Person Search endpoint with Teaser search type (no includes for candidates)
        return await proxy("PersonSearch", payload, [
          "Teaser",
          "PersonSearch",
          "DevAPIPersonSearch",
          "BasePersonSearch",
          "PersonCompositeSearch",
          "PersonSearchLite",
          "BaseSearch",
          "Base",
          "Person",
          "PeopleSearch",
          "PersonSearchStandard",
          "PersonSearchV2",
        ]);

      case "person_profile":
        // Main API: Person Search endpoint with Person search type (full profile with includes)
        return await proxy("PersonSearch", payload, [
          "Person",
          "PersonSearch",
          "DevAPIPersonSearch",
          "BasePersonSearch",
          "PersonCompositeSearch",
          "PersonSearchLite",
          "BaseSearch",
          "Base",
          "PeopleSearch",
          "PersonSearchStandard",
          "PersonSearchV2",
        ], PERSON_SEARCH_INCLUDES_STARTER);

      case "reverse_phone":
        // Dev API: Caller ID -> Phone/Enrich (DevAPICallerID - note the capital D)
        return await proxy("Phone/Enrich", payload, "DevAPICallerID");

      case "email_lookup":
        // Dev API: Email ID -> Email/Enrich (DevAPIEmailID - note capitals)
        return await proxy("Email/Enrich", payload, "DevAPIEmailID");

      case "address_lookup":
        // Dev API: Address ID -> Address/Id (DevAPIAddressID - note capitals)
        return await proxy("Address/Id", payload, "DevAPIAddressID");

      default:
        return new Response(`Unsupported operation: ${operation}`, { 
          status: 400,
          headers: responseHeaders
        });
    }
  } catch (e) {
    console.error("[enformion-search] Error:", e);
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg, endpoint: ENFORMION_ENDPOINT }), {
      status: 502,
      headers: responseHeaders,
    });
  }
});

async function proxy(path: string, base: Record<string, unknown>, searchType: string | string[], includes?: string[]) {
  const payload = { ...base };

  if (includes) (payload as any).includes = includes;

  const headers = new Headers({
    "Content-Type": "application/json",
    "galaxy-ap-name": ENFORMION_AP_NAME,
    "galaxy-ap-password": ENFORMION_AP_PASSWORD,
    "galaxy-client-type": ENFORMION_CLIENT_TYPE,
  });

  const candidatePaths = [
    `${ENFORMION_ENDPOINT}/${path}`,
    `${ENFORMION_ENDPOINT}/api/${path}`,
    `${ENFORMION_ENDPOINT}/v1/${path}`,
    `${ENFORMION_ENDPOINT}/api/v1/${path}`,
    `${ENFORMION_ENDPOINT}/v2/${path}`,
  ];

  const searchTypes = Array.isArray(searchType) ? searchType : [searchType];
  let lastBody = "";

  for (const type of searchTypes) {
    headers.set("galaxy-search-type", type);

    for (const url of candidatePaths) {
      console.log(`[enformion-search] Calling ${url}`);
      console.log(`[enformion-search] Headers: galaxy-search-type=${type}, galaxy-client-type=${ENFORMION_CLIENT_TYPE}`);

      const resp = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const text = await resp.text();
      lastBody = text;

      console.log(`[enformion-search] Response status: ${resp.status}`);
      console.log(`[enformion-search] Response (first 400):`, text.substring(0, 400));

      if (resp.status === 400 && text.includes("Invalid Search Type")) {
        console.log(`[enformion-search] Search type ${type} rejected, trying next variant`);
        break;
      }

      if (resp.status !== 404) {
        // Add CORS headers to successful responses
        const origin = headers.get("origin");
        const corsResponseHeaders: Record<string, string> = {
          ...corsHeaders,
          "Content-Type": "application/json",
        };
        if (origin) {
          corsResponseHeaders["Access-Control-Allow-Origin"] = origin;
        }
        
        return new Response(text, { 
          status: resp.status, 
          headers: corsResponseHeaders
        });
      }
    }
  }

  // Add CORS headers to error responses
  const origin = headers.get("origin");
  const corsErrorHeaders: Record<string, string> = {
    ...corsHeaders,
    "Content-Type": "application/json",
  };
  if (origin) {
    corsErrorHeaders["Access-Control-Allow-Origin"] = origin;
  }

  return new Response(
    JSON.stringify({
      error: "Failed to reach a valid EnformionGO endpoint",
      searchTypes,
      candidatePaths,
      lastBody: lastBody.substring(0, 400),
    }),
    { status: 400, headers: corsErrorHeaders }
  );
}

function must(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

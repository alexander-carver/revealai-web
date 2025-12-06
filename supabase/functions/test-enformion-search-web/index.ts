import { serve } from "https://deno.land/std@0.214.0/http/server.ts";

/* ======================= TEST FUNCTION - WEB (WITH CORS) ======================= */
/* This is a TEST function for web. Do not use in production! */

// CORS headers - required for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
  "Access-Control-Max-Age": "86400",
};

const ENFORMION_ENDPOINT = (Deno.env.get("ENFORMION_BASE_URL") ?? "https://devapi.enformion.com").replace(/\/+$/, "");

const ENFORMION_AP_NAME = must("ENFORMION_API_KEY");
const ENFORMION_AP_PASSWORD = must("ENFORMION_API_SECRET");
const ENFORMION_CLIENT_TYPE = Deno.env.get("ENFORMION_CLIENT_TYPE") ?? "web";

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
  "AssociatesSummary"
];

type Operation =
  | "person_candidates"
  | "person_profile"
  | "reverse_phone"
  | "email_lookup"
  | "address_lookup";

serve(async (req) => {
  console.log("[TEST-enformion-search-web] ⚠️ TEST FUNCTION - WEB VERSION (WITH CORS)");
  
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

  const { operation, ...payload } = body;
  if (!operation || typeof operation !== "string") {
    return new Response("Missing operation", { status: 400, headers: responseHeaders });
  }

  console.log(`[TEST-enformion-search-web] Base URL: ${ENFORMION_ENDPOINT}`);
  console.log(`[TEST-enformion-search-web] Operation: ${operation}`);
  console.log(`[TEST-enformion-search-web] Incoming: ${JSON.stringify(payload)}`);

  try {
    switch (operation as Operation) {
      case "person_candidates":
        return await proxy("PersonSearch", payload, ["Person", "DevAPIPersonSearch"], undefined, false, responseHeaders);
      case "person_profile":
        return await proxy("PersonSearch", payload, ["Person"], PERSON_SEARCH_INCLUDES_STARTER, true, responseHeaders);
      case "reverse_phone":
        return await proxy("Phone/Enrich", payload, "DevAPICallerID", undefined, false, responseHeaders);
      case "email_lookup":
        return await proxy("Email/Enrich", payload, "DevAPIEmailID", undefined, false, responseHeaders);
      case "address_lookup":
        return await proxy("Address/Id", payload, "DevAPIAddressID", undefined, false, responseHeaders);
      default:
        return new Response(`Unsupported operation: ${operation}`, { status: 400, headers: responseHeaders });
    }
  } catch (e) {
    console.error("[TEST-enformion-search-web] Error:", e);
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({
      error: msg,
      endpoint: ENFORMION_ENDPOINT,
      test: true
    }), {
      status: 502,
      headers: responseHeaders
    });
  }
});

async function proxy(
  path: string,
  base: Record<string, unknown>,
  searchType: string | string[],
  includes?: string[],
  requireIdForIncludes = false,
  corsResponseHeaders: Record<string, string>
) {
  const wantIncludes = !!(includes && includes.length);
  const normalized = path === "PersonSearch" ? normalizePersonPayload(base, wantIncludes) : { ...base };

  let payload: any = normalized;

  if (wantIncludes) {
    const hasId = Array.isArray(normalized.TahoeIds) && normalized.TahoeIds.length > 0;
    if (requireIdForIncludes && !hasId) {
      return new Response(JSON.stringify({
        error: "missing_unique_id_for_includes",
        message: "Send enformionId (or tahoeId) from the selected candidate when requesting Includes.",
        test: true
      }), {
        status: 400,
        headers: corsResponseHeaders
      });
    }

    if (hasId) {
      payload = { TahoeIds: normalized.TahoeIds, Includes: includes };
      console.log(`[TEST-enformion-search-web] Using TahoeIds-only payload`);
    } else {
      payload.Includes = includes;
    }
  } else {
    if (payload.TahoeIds) {
      console.log("[TEST-enformion-search-web] Stripping TahoeIds for candidate search");
      delete payload.TahoeIds;
    }
  }

  console.log(`[TEST-enformion-search-web] Final payload:\n${JSON.stringify(payload, null, 2)}`);

  const headers = new Headers({
    "Content-Type": "application/json",
    Accept: "application/json",
    "galaxy-ap-name": ENFORMION_AP_NAME,
    "galaxy-ap-password": ENFORMION_AP_PASSWORD,
    "galaxy-client-type": ENFORMION_CLIENT_TYPE,
    "galaxy-client-session-id": crypto.randomUUID()
  });

  const candidatePaths = [
    `${ENFORMION_ENDPOINT}/${path}`,
    `${ENFORMION_ENDPOINT}/api/${path}`,
    `${ENFORMION_ENDPOINT}/v1/${path}`,
    `${ENFORMION_ENDPOINT}/api/v1/${path}`,
    `${ENFORMION_ENDPOINT}/v2/${path}`
  ];

  const searchTypes = Array.isArray(searchType) ? searchType : [searchType];
  let lastBody = "";

  for (const type of searchTypes) {
    headers.set("galaxy-search-type", String(type));
    for (const url of candidatePaths) {
      console.log(`[TEST-enformion-search-web] Calling ${url}`);
      console.log(`[TEST-enformion-search-web] Headers: galaxy-search-type=${type}, client-type=${ENFORMION_CLIENT_TYPE}`);

      const resp = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });

      const text = await resp.text();
      lastBody = text;

      console.log(`[TEST-enformion-search-web] Response status: ${resp.status}`);
      console.log(`[TEST-enformion-search-web] Response (first 400): ${text.substring(0, 400)}`);

      if (resp.status === 400 && /Invalid Search Type/i.test(text)) break;
      if (resp.status !== 404) {
        return new Response(text, {
          status: resp.status,
          headers: corsResponseHeaders
        });
      }
    }
  }

  return new Response(JSON.stringify({
    error: "Failed to reach a valid EnformionGO endpoint",
    searchTypes,
    candidatePaths,
    lastBody: lastBody.substring(0, 400),
    test: true
  }), {
    status: 400,
    headers: corsResponseHeaders
  });
}

function normalizePersonPayload(base: any, wantIncludes: boolean) {
  const out: any = {};
  const get = (...keys: string[]) => keys.map((k) => base?.[k]).find((v) => v != null);

  const f = get("FirstName", "firstName");
  if (f) out.FirstName = String(f).trim();
  const m = get("MiddleName", "middleName");
  if (m) out.MiddleName = String(m).trim();
  const l = get("LastName", "lastName");
  if (l) out.LastName = String(l).trim();
  const dob = get("Dob", "dob");
  if (dob) out.Dob = String(dob).trim();
  const age = get("Age", "age");
  if (age != null) {
    const n = Number(String(age).replace(/[^\d]/g, ""));
    if (!Number.isNaN(n) && n > 0) out.Age = n;
  }
  const phone = get("Phone", "phone");
  if (phone) out.Phone = String(phone).replace(/[^0-9]/g, "");
  const email = get("Email", "email");
  if (email) out.Email = String(email).toLowerCase().trim();

  const addrs: any[] = [];
  if (Array.isArray(base?.Addresses)) {
    for (const a of base.Addresses) {
      const x: any = {};
      if (a.AddressLine1) x.AddressLine1 = String(a.AddressLine1).trim();
      if (a.AddressLine2) x.AddressLine2 = String(a.AddressLine2).trim();
      if (a.City) x.City = String(a.City).trim();
      if (a.State) x.State = String(a.State).trim();
      if (a.Zip) x.Zip = String(a.Zip).trim();
      if (Object.keys(x).length) addrs.push(x);
    }
  }

  if (addrs.length === 0) {
    const a: any = {};
    const city = base?.address?.city ?? base?.city ?? base?.City;
    const state = base?.address?.state ?? base?.state ?? base?.State;
    const line1 = base?.address?.line1 ?? base?.AddressLine1;
    const line2 = base?.address?.line2 ?? base?.AddressLine2;
    const zip = base?.address?.postalCode ?? base?.Zip ?? base?.PostalCode ?? base?.zip;
    if (line1) a.AddressLine1 = String(line1).trim();
    if (line2) a.AddressLine2 = String(line2).trim();
    if (city) a.City = String(city).trim();
    if (state) a.State = String(state).trim();
    if (zip) a.Zip = String(zip).trim();
    if ((city || state) && !a.AddressLine2) {
      const cs = [city, state].filter(Boolean).join(", ");
      if (cs) a.AddressLine2 = cs;
    }
    if (Object.keys(a).length) addrs.push(a);
  }

  if (addrs.length) out.Addresses = addrs;

  if (wantIncludes) {
    const rawId = get("TahoeId", "tahoeId", "enformionId", "EnformionId");
    if (rawId) out.TahoeIds = [String(rawId).trim()];
  }

  return out;
}

function must(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}


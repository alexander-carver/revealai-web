import { serve } from "https://deno.land/std@0.214.0/http/server.ts";

// CORS headers - required for browser requests, ignored by mobile
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
  "Access-Control-Max-Age": "86400",
};

/* ----------------- Enformion config ----------------- */
const ENFORMION_ENDPOINT = (Deno.env.get("ENFORMION_BASE_URL") ?? "https://devapi.enformion.com").replace(/\/+$/, "");
const ENFORMION_AP_NAME = must("ENFORMION_API_KEY");
const ENFORMION_AP_PASSWORD = must("ENFORMION_API_SECRET");
// Use "ios" to match mobile function - Enformion may treat different client types differently
const ENFORMION_CLIENT_TYPE = Deno.env.get("ENFORMION_CLIENT_TYPE") ?? "ios";

/* ---- Person Search includes - balanced set for good data without overwhelming API ---- */
const PERSON_SEARCH_INCLUDES_FULL = [
  // Basic Info (always works)
  "Addresses",
  "Akas",
  "PhoneNumbers",
  "EmailAddresses",
  
  // People Connections
  "Relatives",
  "Associates", 
  "Neighbors",
  "RelativesSummary",
  "AssociatesSummary",
  
  // Employment
  "WorkPlace",
  
  // Indicators (flags for what data exists)
  "Indicators",
];

/* ======================= HTTP Entry ======================= */
serve(async (req) => {
  // Handle CORS preflight (browsers only, mobile ignores this)
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  // Get origin for CORS
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
      headers: {
        ...responseHeaders,
        Allow: "POST"
      }
    });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return new Response("Invalid JSON", {
    status: 400,
    headers: responseHeaders
  });

  const { operation, mode, appVersion, ...payload } = body;
  if (!operation || typeof operation !== "string") return new Response("Missing operation", {
    status: 400,
    headers: responseHeaders
  });

  // Strip out frontend-only fields that Enformion doesn't expect
  const cleanPayload = { ...payload };
  delete cleanPayload.mode;
  delete cleanPayload.appVersion;

  console.log(`[enformion-search-web] Base URL: ${ENFORMION_ENDPOINT}`);
  console.log(`[enformion-search-web] Operation: ${operation}`);
  console.log(`[enformion-search-web] Incoming: ${JSON.stringify(payload)}`);
  console.log(`[enformion-search-web] Cleaned payload: ${JSON.stringify(cleanPayload)}`);

  try {
    switch (operation) {
      case "person_candidates":
        // ✅ Candidate search: use "Person" only (more broadly supported).
        return await proxy("PersonSearch", cleanPayload, /* searchType */ [
          "Person",
          "DevAPIPersonSearch"
        ], undefined, false, responseHeaders);

      case "person_profile":
        // ✅ Full profile (Includes) — documented TahoeIds array + "Person".
        return await proxy("PersonSearch", cleanPayload, [
          "Person"
        ], PERSON_SEARCH_INCLUDES_FULL, /* requireIdForIncludes */ true, responseHeaders);

      case "reverse_phone": {
        // Transform Phone field if needed
        const phonePayload: Record<string, unknown> = {};
        const phone = cleanPayload.Phone || cleanPayload.phone;
        if (phone) phonePayload.Phone = String(phone).replace(/[^0-9]/g, "");
        phonePayload.Page = 1;
        phonePayload.ResultsPerPage = 10;
        return await proxy("Phone/Enrich", phonePayload, "DevAPICallerID", undefined, false, responseHeaders);
      }

      case "email_lookup": {
        // Transform Email field if needed
        const emailPayload: Record<string, unknown> = {};
        const email = cleanPayload.Email || cleanPayload.email;
        if (email) emailPayload.Email = String(email).toLowerCase().trim();
        emailPayload.Page = 1;
        emailPayload.ResultsPerPage = 10;
        return await proxy("Email/Enrich", emailPayload, "DevAPIEmailID", undefined, false, responseHeaders);
      }

      case "address_lookup": {
        // Transform address fields to match EnformionGO demo exactly
        // Format: { AddressLine1: "...", AddressLine2: "city, state", Page: 1, ResultsPerPage: 10 }
        const addressPayload: Record<string, unknown> = {};
        const street = cleanPayload.Street || cleanPayload.street || cleanPayload.AddressLine1;
        const city = cleanPayload.City || cleanPayload.city;
        const state = cleanPayload.State || cleanPayload.state;
        
        // AddressLine1 is the street address
        if (street) addressPayload.AddressLine1 = String(street).trim();
        
        // AddressLine2 is REQUIRED - combine city, state (exactly like EnformionGO demo)
        const line2Parts = [city, state].filter(Boolean);
        addressPayload.AddressLine2 = line2Parts.length > 0 
          ? line2Parts.join(", ") 
          : "US"; // Fallback
        
        // Add pagination like EnformionGO demo
        addressPayload.Page = 1;
        addressPayload.ResultsPerPage = 10;
        
        console.log(`[enformion-search-web] Address payload transformed:`, JSON.stringify(addressPayload));
        return await proxy("Address/Id", addressPayload, "DevAPIAddressID", undefined, false, responseHeaders);
      }

      default:
        return new Response(`Unsupported operation: ${operation}`, {
          status: 400,
          headers: responseHeaders
        });
    }
  } catch (e) {
    console.error("[enformion-search-web] Error:", e);
    // NEVER fail - always return empty results on error
    return new Response(JSON.stringify({
      persons: [],
      results: [],
      pagination: { totalResults: 0, currentPageNumber: 1, resultsPerPage: 25 },
      _error: e instanceof Error ? e.message : String(e)
    }), {
      status: 200,  // Always 200 so frontend doesn't break
      headers: responseHeaders
    });
  }
});

/* ================= Helpers & Core Proxy =================== */
/** Normalize PersonSearch payload.
 *  IMPORTANT:
 *  - For candidate mode (wantIncludes = false): DO NOT carry TahoeIds.
 *  - For profile mode     (wantIncludes = true): accept tahoeId/enformionId and emit TahoeIds: [id].
 */
function normalizePersonPayload(base: any, wantIncludes: boolean) {
  const out: any = {};
  const get = (...keys: string[]) => keys.map((k) => base?.[k]).find((v) => v != null);

  // Names / basics
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

  // Addresses[]
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

  // TahoeIds only in profile (Includes) mode; never from generic `id`.
  if (wantIncludes) {
    const rawId = get("TahoeId", "tahoeId", "enformionId", "EnformionId");
    if (rawId) out.TahoeIds = [String(rawId).trim()];
  }

  return out;
}

/** Proxy with Includes guard.
 *  - Candidates: "Person"/"DevAPIPersonSearch", no TahoeIds.
 *  - Profile: send { TahoeIds, Includes } only (clean payload).
 */
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

  // Build final payload
  let payload: any = normalized;

  if (wantIncludes) {
    const hasId = Array.isArray(normalized.TahoeIds) && normalized.TahoeIds.length > 0;

    if (requireIdForIncludes && !hasId) {
      return new Response(JSON.stringify({
        error: "missing_unique_id_for_includes",
        message: "Send enformionId (or tahoeId) from the selected candidate when requesting Includes."
      }), {
        status: 400,
        headers: corsResponseHeaders
      });
    }

    if (hasId) {
      // Clean, documented payload for profile:
      payload = {
        TahoeIds: normalized.TahoeIds,
        Includes: includes
      };
      console.log(`[enformion-search-web] Using TahoeIds-only payload (no search params)`);
    } else {
      payload.Includes = includes;
    }
  } else {
    // Candidate flow: ensure we didn't accidentally carry TahoeIds
    if (payload.TahoeIds) {
      console.log("[enformion-search-web] Stripping TahoeIds for candidate search");
      delete payload.TahoeIds;
    }
  }

  console.log(`[enformion-search-web] Final payload to Enformion:\n${JSON.stringify(payload, null, 2)}`);

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
      console.log(`[enformion-search-web] Calling ${url}`);
      console.log(`[enformion-search-web] Headers: galaxy-search-type=${type}, client-type=${ENFORMION_CLIENT_TYPE}`);

      // Retry logic for connection errors
      let resp: Response | null = null;
      let text = "";
      let lastError: Error | null = null;
      const MAX_RETRIES = 3;
      
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          resp = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify(payload)
          });
          text = await resp.text();
          lastBody = text;
          lastError = null;
          break; // Success, exit retry loop
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          console.log(`[enformion-search-web] Attempt ${attempt}/${MAX_RETRIES} failed: ${lastError.message}`);
          
          // Only retry on connection errors
          if (lastError.message.includes("connection") || 
              lastError.message.includes("reset") ||
              lastError.message.includes("network")) {
            if (attempt < MAX_RETRIES) {
              // Wait before retrying (exponential backoff: 500ms, 1000ms, 2000ms)
              const delay = 500 * Math.pow(2, attempt - 1);
              console.log(`[enformion-search-web] Retrying in ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          } else {
            // Non-retryable error, break out
            break;
          }
        }
      }

      // If all retries failed, continue to next URL or search type
      if (lastError || !resp) {
        console.log(`[enformion-search-web] All retries failed for ${url}`);
        continue;
      }

      console.log(`[enformion-search-web] Response status: ${resp.status}`);
      console.log(`[enformion-search-web] Response (first 400): ${text.substring(0, 400)}`);

      // If Enformion returns 400, check if it's an "Invalid Search Type" error
      if (resp.status === 400 && /Invalid Search Type/i.test(text)) {
        console.log(`[enformion-search-web] Search type ${type} rejected, trying next variant`);
        break; // try next type
      }

      // If we got a response (not 404), process it
      if (resp.status !== 404) {
        // Check if the response indicates no results (empty pagination) or is an error
        try {
          const jsonData = JSON.parse(text);
          
          // Check if there's a real error - handle multiple error formats from Enformion
          // Format 1: { error: { inputErrors: [...] } } (nested)
          // Format 2: { inputErrors: [...], message: "..." } (top-level, from Address/Id, Phone/Enrich, etc)
          const nestedError = jsonData.error;
          const topLevelError = jsonData.inputErrors?.length > 0 || jsonData.code === "Invalid Input";
          
          const hasRealError = resp.status >= 400 || topLevelError || (
            nestedError && 
            typeof nestedError === 'object' &&
            ((nestedError.inputErrors?.length > 0) || 
             (nestedError.warnings?.length > 0) ||
             nestedError.message)
          ) || (
            typeof nestedError === 'string' && nestedError.length > 0
          );
          
          // If Enformion returned a real error, return empty results instead of failing
          if (hasRealError) {
            // Extract error message from either format
            const errorMessage = jsonData.message || nestedError?.message || nestedError || `Status ${resp.status}`;
            console.log(`[enformion-search-web] Enformion returned error:`, errorMessage);
            return new Response(JSON.stringify({
              persons: [],
              results: [],
              pagination: { totalResults: 0, currentPageNumber: 1, resultsPerPage: 25 },
              _info: "No results found for this search criteria"
            }), {
              status: 200,  // Always 200 so frontend doesn't break
              headers: corsResponseHeaders
            });
          }
          
          if (jsonData.pagination && jsonData.pagination.totalResults === 0) {
            console.log(`[enformion-search-web] Enformion returned empty results`);
            return new Response(JSON.stringify({
              persons: [],
              results: [],
              pagination: jsonData.pagination
            }), {
              status: 200,
              headers: corsResponseHeaders
            });
          }
          
          // Success! Return the actual data
          console.log(`[enformion-search-web] Success! Returning data with ${jsonData.persons?.length || 0} persons`);
          return new Response(text, {
            status: 200,  // Always 200
            headers: corsResponseHeaders
          });
        } catch {
          // Not JSON - treat as error, return empty results
          console.log(`[enformion-search-web] Non-JSON response, returning empty results`);
          return new Response(JSON.stringify({
            persons: [],
            results: [],
            pagination: { totalResults: 0, currentPageNumber: 1, resultsPerPage: 25 }
          }), {
            status: 200,
            headers: corsResponseHeaders
          });
        }
      }
    }
  }

  // NEVER fail - return empty results if all attempts failed
  console.log("[enformion-search-web] All endpoints failed, returning empty results");
  return new Response(JSON.stringify({
    persons: [],
    results: [],
    pagination: { totalResults: 0, currentPageNumber: 1, resultsPerPage: 25 },
    _warning: "Could not reach Enformion API"
  }), {
    status: 200,  // Always 200 so frontend doesn't break
    headers: corsResponseHeaders
  });
}

/* ------------------------ Utils ------------------------ */
function must(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

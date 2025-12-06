import { serve } from "https://deno.land/std@0.214.0/http/server.ts";

/* ======================= TEST FUNCTION - MOBILE ======================= */
/* This is a TEST function for mobile. Do not use in production! */

const ENFORMION_ENDPOINT = (Deno.env.get("ENFORMION_BASE_URL") ?? "https://devapi.enformion.com").replace(/\/+$/, "");
const ENFORMION_AP_NAME = must("ENFORMION_API_KEY");
const ENFORMION_AP_PASSWORD = must("ENFORMION_API_SECRET");
const ENFORMION_CLIENT_TYPE = Deno.env.get("ENFORMION_CLIENT_TYPE") ?? "ios";

serve(async (req) => {
  console.log("[TEST-enformion-records] ⚠️ TEST FUNCTION - MOBILE VERSION");

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

  const { person, jurisdictions } = body;

  console.log("[TEST-enformion-records] Person:", JSON.stringify(person));

  if (!person || !person.firstName || !person.lastName) {
    return new Response(JSON.stringify({
      error: "Missing required fields: firstName and lastName",
      test: true
    }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const startTime = Date.now();

  // TODO: Replace with actual Enformion Records API call
  // For now, return test data
  const records = [
    {
      id: "test-record-1",
      category: "Traffic",
      caseNumber: "TC-2023-001234",
      filedDate: "2023-06-15",
      status: "Closed",
      jurisdiction: `${person.city || "Austin"}, ${person.state || "TX"}`,
      description: "Minor traffic violation - speeding",
    },
    {
      id: "test-record-2",
      category: "Civil",
      caseNumber: "CV-2022-005678",
      filedDate: "2022-03-22",
      status: "Resolved",
      jurisdiction: `${person.state || "TX"} District Court`,
      description: "Small claims dispute",
    },
  ];

  const tookMs = Date.now() - startTime;

  return new Response(JSON.stringify({
    records,
    provider: "enformion",
    tookMs,
    test: true
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
});

function must(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}


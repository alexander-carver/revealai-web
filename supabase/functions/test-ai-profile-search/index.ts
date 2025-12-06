import { serve } from "https://deno.land/std@0.214.0/http/server.ts";

/* ======================= TEST FUNCTION - MOBILE ======================= */
/* This is a TEST function for mobile. Do not use in production! */

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";

serve(async (req) => {
  console.log("[TEST-ai-profile-search] ⚠️ TEST FUNCTION - MOBILE VERSION");

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

  const { model = "gpt-4o", messages } = body;

  console.log("[TEST-ai-profile-search] Model:", model);
  console.log("[TEST-ai-profile-search] Messages:", JSON.stringify(messages));

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({
      error: "Missing or invalid messages",
      test: true
    }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const userQuery = messages.find((m: any) => m.role === "user")?.content || "";

  if (!OPENAI_API_KEY) {
    return new Response(JSON.stringify({
      content: `AI search is not configured. Query received: "${userQuery}"\n\nTo enable AI search, set the OPENAI_API_KEY environment variable.`,
      test: true
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Call OpenAI API
  const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: `You are a helpful research assistant specializing in finding public information about people. 
When given a query about a person, provide helpful information that might be publicly available.
Be factual and note when information is speculative or uncertain.
Format your response in a clear, readable way.
Do not make up specific personal details like addresses or phone numbers.`,
        },
        ...messages,
      ],
      max_tokens: 1000,
      temperature: 0.7,
    }),
  });

  if (!openaiResponse.ok) {
    const errorData = await openaiResponse.json();
    throw new Error(errorData.error?.message || "OpenAI API error");
  }

  const data = await openaiResponse.json();
  const content = data.choices?.[0]?.message?.content || "No response generated";

  return new Response(JSON.stringify({
    content,
    test: true
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
});


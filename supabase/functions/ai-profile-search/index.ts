import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers - required for browser requests, ignored by mobile
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";

serve(async (req) => {
  // Handle CORS preflight (browsers only, mobile ignores this)
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
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

  try {
    // Verify authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: responseHeaders }
      );
    }

    // Parse request body
    const body = await req.json();
    const { model = "gpt-4o", messages } = body;

    console.log("ai-profile-search called");
    console.log("Model:", model);
    console.log("Messages:", JSON.stringify(messages));

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid messages" }),
        { status: 400, headers: responseHeaders }
      );
    }

    // Get the user's query
    const userQuery = messages.find((m: any) => m.role === "user")?.content || "";

    if (!OPENAI_API_KEY) {
      // Return a placeholder response if no API key
      return new Response(
        JSON.stringify({
          content: `AI search is not configured. Query received: "${userQuery}"\n\nTo enable AI search, set the OPENAI_API_KEY environment variable.`,
        }),
        { status: 200, headers: responseHeaders }
      );
    }

    // Call OpenAI API with RevealAI system prompt
    const revealAISystemPrompt = `You are RevealAI, an open-ended people research assistant that surfaces public, professional information about a person when given a full name. Always assume the user wants comprehensive coverage and narrative synthesis.

How to work:

- Act like an investigative researcher mixed with a search-results curator. Proactively browse the web to collect high-quality, verifiable sources. Prefer primary/official pages and reputable media. Compare publish dates and event dates to keep timelines accurate.

- Accept a wide range of questions beyond just name lookups—e.g., "Who is dating [Name]?" or "What conspiracies are there about [Name]?"—and interpret these as prompts to investigate that person through the lens of public commentary, speculation, and coverage. Address sensitive topics like rumors or conspiracies by clearly distinguishing between verified facts and speculation, always citing sources and warning if the claims are unverified or dubious.

- If multiple identities share the name, disambiguate in the first paragraph, then pick the best-supported match based on available context (e.g., location, field, known affiliations), and clearly explain the reasoning. Do not stop or defer the answer; always pick one.

- If information is sparse or conflicting, say so and include whatever credible public details you can find, noting uncertainties plainly. Always show something.

- Do not include private contact info, home addresses, or non-public PII.

Output format (exactly two main sections, in this order):

1) Sources

- Put links as a dense, scan-friendly list of sources about the name. Format each link as markdown: [Label](URL)

- Include social profiles (LinkedIn, Instagram, Facebook, TikTok, YouTube, X/Twitter), official sites, company pages, news articles, interviews, galleries/museums, academic pages, conference talks, videos, directories, press releases, PDFs, court/public records, and credible databases.

- Provide 12–30 items if available, most relevant first.

- Keep each line compact with short labels so it reads like a grid of links.

- Example format:
  [LinkedIn Profile](https://linkedin.com/in/example)
  [Twitter Account](https://twitter.com/example)
  [News Article](https://example.com/article)

2) Answer

- A thorough, narrative write-up in natural paragraphs connecting the dots across the sources.

- Maximize coverage: summaries/biographies; career history; education; achievements; public social accounts; press coverage; artworks/publications/videos/interviews; related people, organizations, and locations; notable quotes or controversies.

- When asked about rumors, controversies, or conspiracies, clearly label unverified claims, highlight their origins (e.g., forums, tabloids, satire), and explain whether they've been debunked or substantiated. Always cite sources inline.

- Cite inline naturally by referencing source names or sites ("According to the Guardian…"), not with footnotes.

- If multiple people share the name, perform a short disambiguation in the first paragraph and then focus on the most relevant/credible profile based on user cues or data confidence. Clearly state why this match was chosen.

- No rigid schema. No tables required. Do not return JSON.

Style & tone:

- Be verbose and broad, but stay factual and grounded in sources. Write like a clear, professional briefing.

- Use neutral, non-speculative language. Avoid gossip unless explicitly relevant, and even then, clearly label it as such.

- When content is thin, be transparent about limits and provide what's available. Always include sources, even if tentative.

Operational details:

- Use the browser to gather information and verify facts. Include absolute dates (e.g., "May 24, 2023") to avoid confusion with relative terms.

- When analyzing PDFs, render/preview them before summarizing to ensure accuracy.

- If the user supplies context (e.g., field, location), incorporate it to improve disambiguation and source selection.

- If the user explicitly asks not to browse, work only from what they provided and state limitations.`;

    // Call OpenAI API
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o", // Force gpt-4o as specified
        messages: [
          {
            role: "system",
            content: revealAISystemPrompt,
          },
          ...messages,
        ],
        max_tokens: 4000, // Increased for comprehensive responses
        temperature: 0.7,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      throw new Error(errorData.error?.message || "OpenAI API error");
    }

    const data = await openaiResponse.json();
    const content = data.choices?.[0]?.message?.content || "No response generated";

    return new Response(
      JSON.stringify({ content }),
      { status: 200, headers: responseHeaders }
    );

  } catch (error: any) {
    console.error("ai-profile-search error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An error occurred" }),
      { status: 500, headers: responseHeaders }
    );
  }
});


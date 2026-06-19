import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  buildFallbackReportFromContent,
  buildReportText,
  buildRevealSearchInput,
  buildRevealSearchNarrativePrompt,
  buildRevealSearchSystemPrompt,
  hydrateSearchReport,
  normalizeReportSearchType,
  parseStructuredReportDraft,
  type SearchReport,
  type SearchReportImage,
  type SearchReportSource,
} from "@/lib/reveal-search";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const perplexityApiKey = (process.env.PERPLEXITY_API_KEY ?? "")
  .replace(/\\n/g, "")
  .trim();

const SEARCH_DEBUG_MODE =
  process.env.NODE_ENV !== "production" &&
  process.env.STRIPE_DEBUG_TEST_MODE === "true";
const PRO_USER_DAILY_LIMIT = SEARCH_DEBUG_MODE ? 200 : 15;
const PERPLEXITY_PRIMARY_MODEL = "sonar-pro";
const PERPLEXITY_FALLBACK_MODEL = "sonar";
const PERPLEXITY_RATE_LIMIT_RETRIES = SEARCH_DEBUG_MODE ? 6 : 3;
const MAX_SOURCE_PAGES_FOR_IMAGES = 8;
const MAX_IMAGES = 12;

type SearchStage = "primary_structured" | "fallback_narrative";
type PerplexityResponseShape = Record<string, any>;

function cleanText(value: string | undefined | null) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeUrl(url: string | undefined | null) {
  if (!url) return null;
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) return null;

  try {
    return new URL(trimmed).toString();
  } catch {
    return null;
  }
}

function getDomainLabel(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "source";
  }
}

function uniqueBy<T>(items: T[], key: (item: T) => string | null) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const value = key(item);
    if (!value || seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

function extractPerplexityErrorMessage(errorText: string) {
  try {
    const parsed = JSON.parse(errorText) as {
      error?: { message?: string };
      message?: string;
    };
    return parsed.error?.message || parsed.message || errorText;
  } catch {
    return errorText;
  }
}

function getRateLimitRetrySeconds(
  errorText: string,
  retryAfterHeader?: string | null,
) {
  const retryAfterSeconds = Number(retryAfterHeader);
  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
    return retryAfterSeconds;
  }

  const match = errorText.match(/retry after\s+([0-9.]+)/i);
  if (!match) return null;

  const seconds = Number(match[1]);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
}

function getFriendlyPerplexityErrorMessage(errorText: string) {
  const rawMessage = extractPerplexityErrorMessage(errorText);

  if (/rate limit/i.test(rawMessage)) {
    return "Search volume is high right now. Please try again in a moment.";
  }

  if (/invalid api key|authentication/i.test(rawMessage)) {
    return "Perplexity API key is not configured correctly.";
  }

  return rawMessage || "Search failed";
}

async function perplexityRequestWithRetry(body: string) {
  let lastResponse: Response | null = null;
  let lastErrorText = "";

  for (
    let attempt = 0;
    attempt <= PERPLEXITY_RATE_LIMIT_RETRIES;
    attempt += 1
  ) {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${perplexityApiKey}`,
        "Content-Type": "application/json",
      },
      body,
    });

    if (response.ok || response.status !== 429) {
      return { response, errorText: "" };
    }

    lastResponse = response;
    lastErrorText = await response.text();

    const retryAfterSeconds = getRateLimitRetrySeconds(
      lastErrorText,
      response.headers.get("Retry-After"),
    );

    if (attempt === PERPLEXITY_RATE_LIMIT_RETRIES || !retryAfterSeconds) {
      return { response, errorText: lastErrorText };
    }

    await new Promise((resolve) =>
      setTimeout(resolve, Math.ceil(retryAfterSeconds * 1000) + 250),
    );
  }

  return {
    response: lastResponse!,
    errorText: lastErrorText,
  };
}

function buildStructuredSystemPrompt(searchType?: string | null) {
  return `${buildRevealSearchSystemPrompt(searchType)}

Critical response format:
- Return only a single valid JSON object.
- Do not wrap the response in markdown fences.
- Use exactly these top-level keys: hero, quickFacts, executiveSummary, sections, timeline, sources, imageLeads, followUpQueries, caveats.
- Each object in the JSON must stay compact, factual, and source-aware.
- When evidence is thin, keep the tone decisive and premium while clearly grounding claims in the visible public-web record.`;
}

function getStageRuntimeProfile(
  stage: SearchStage,
  searchType: ReturnType<typeof normalizeReportSearchType>,
) {
  const isFullReport = searchType === "fullreport";
  const isDeepSearch =
    isFullReport || searchType === "records" || searchType === "privacy";

  if (stage === "primary_structured") {
    return {
      model: PERPLEXITY_PRIMARY_MODEL,
      maxTokens: isFullReport ? 4200 : isDeepSearch ? 3200 : 2200,
      structured: true,
    } as const;
  }

  return {
    model: PERPLEXITY_FALLBACK_MODEL,
    maxTokens: isFullReport ? 3400 : isDeepSearch ? 2600 : 1800,
    structured: false,
  } as const;
}

function extractPerplexityContent(data: PerplexityResponseShape) {
  return cleanText(data?.choices?.[0]?.message?.content);
}

function extractPerplexityCitations(data: PerplexityResponseShape) {
  const sources = [
    ...(Array.isArray(data?.citations) ? data.citations : []),
    ...(Array.isArray(data?.choices?.[0]?.citations)
      ? data.choices[0].citations
      : []),
    ...(Array.isArray(data?.choices?.[0]?.message?.citations)
      ? data.choices[0].message.citations
      : []),
  ];

  return uniqueBy(
    sources
      .map((source) =>
        typeof source === "string"
          ? normalizeUrl(source)
          : normalizeUrl(source?.url),
      )
      .filter(Boolean) as string[],
    (value) => value,
  );
}

function extractPerplexitySearchResults(data: PerplexityResponseShape) {
  const searchResults = [
    ...(Array.isArray(data?.search_results) ? data.search_results : []),
    ...(Array.isArray(data?.choices?.[0]?.search_results)
      ? data.choices[0].search_results
      : []),
    ...(Array.isArray(data?.choices?.[0]?.message?.search_results)
      ? data.choices[0].message.search_results
      : []),
  ];

  return uniqueBy(
    searchResults
      .map((result) => {
        const url = normalizeUrl(result?.url);
        if (!url) return null;

        return {
          title: cleanText(result?.title) || getDomainLabel(url),
          url,
          date: cleanText(result?.date),
        };
      })
      .filter(Boolean) as Array<{ title: string; url: string; date: string }>,
    (value) => value.url,
  );
}

function extractPerplexityRelatedQuestions(data: PerplexityResponseShape) {
  const related = [
    ...(Array.isArray(data?.related_questions) ? data.related_questions : []),
    ...(Array.isArray(data?.choices?.[0]?.related_questions)
      ? data.choices[0].related_questions
      : []),
    ...(Array.isArray(data?.choices?.[0]?.message?.related_questions)
      ? data.choices[0].message.related_questions
      : []),
  ];

  return uniqueBy(
    related.map((item) => cleanText(item)).filter(Boolean),
    (value) => value.toLowerCase(),
  ).slice(0, 8);
}

function extractPerplexityImageUrls(data: PerplexityResponseShape) {
  const values = [
    ...(Array.isArray(data?.images) ? data.images : []),
    ...(Array.isArray(data?.choices?.[0]?.images)
      ? data.choices[0].images
      : []),
    ...(Array.isArray(data?.choices?.[0]?.message?.images)
      ? data.choices[0].message.images
      : []),
  ];

  return uniqueBy(
    values
      .map((value) => {
        if (typeof value === "string") return normalizeUrl(value);
        return (
          normalizeUrl(value?.url) ||
          normalizeUrl(value?.image_url) ||
          normalizeUrl(value?.src)
        );
      })
      .filter(Boolean) as string[],
    (value) => value,
  ).slice(0, MAX_IMAGES);
}

function inferSourceType(url: string, title?: string) {
  const haystack = `${url} ${title ?? ""}`.toLowerCase();

  if (
    /\.gov\b|official|company|foundation|museum|school|university|college/.test(
      haystack,
    )
  ) {
    return "official";
  }

  if (
    /linkedin|instagram|facebook|tiktok|youtube|twitter|x\.com|threads|github/.test(
      haystack,
    )
  ) {
    return "social";
  }

  if (
    /court|docket|arrest|booking|records|registry|case|judgment/.test(haystack)
  ) {
    return "record";
  }

  if (
    /wikipedia|whitepages|spokeo|truepeoplesearch|crunchbase|directory|database|imdb|allmusic|britannica/.test(
      haystack,
    )
  ) {
    return "directory";
  }

  if (
    /reuters|apnews|cnn|foxnews|nytimes|washingtonpost|theguardian|bloomberg|forbes|news|press/.test(
      haystack,
    )
  ) {
    return "news";
  }

  return "source";
}

function buildDiscoveredSources(data: PerplexityResponseShape) {
  const searchResults = extractPerplexitySearchResults(data);
  const citations = extractPerplexityCitations(data);

  const resultSources = searchResults.map((result) => ({
    title: result.title,
    url: result.url,
    domain: getDomainLabel(result.url),
    type: inferSourceType(result.url, result.title),
    note: result.date
      ? `Search result dated ${result.date}`
      : "Search result surfaced during the report run",
  }));

  const citationSources = citations
    .filter(
      (url) => !resultSources.some((resultSource) => resultSource.url === url),
    )
    .map((url) => ({
      title: getDomainLabel(url),
      url,
      domain: getDomainLabel(url),
      type: inferSourceType(url),
      note: "Citation referenced in the answer",
    }));

  return uniqueBy(
    [...resultSources, ...citationSources],
    (source) => source.url,
  ) as SearchReportSource[];
}

function mergeDraftSources(
  draft: Record<string, unknown>,
  discoveredSources: SearchReportSource[],
) {
  const existing = Array.isArray(draft.sources) ? draft.sources : [];

  return {
    ...draft,
    sources: [...existing, ...discoveredSources],
  };
}

function mergeSourcesIntoReport(
  report: SearchReport,
  discoveredSources: SearchReportSource[],
) {
  report.sources = uniqueBy(
    [...report.sources, ...discoveredSources],
    (source) => source.url,
  );

  return report;
}

function mergeFollowUpQueries(
  report: SearchReport,
  relatedQuestions: string[],
) {
  report.followUpQueries = uniqueBy(
    [...report.followUpQueries, ...relatedQuestions],
    (value) => value.toLowerCase(),
  ).slice(0, 8);

  return report;
}

function buildSeedImages(
  imageUrls: string[],
  subject: string,
): SearchReportImage[] {
  return imageUrls.map((url, index) => ({
    url,
    sourcePageUrl: url,
    sourceTitle: `Image result ${index + 1}`,
    caption: `Public image related to ${subject}`,
    confidence: "medium" as const,
  }));
}

function getFallbackImage(subject: string): SearchReportImage {
  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    subject,
  )}&size=900&background=0f172a&color=ffffff&format=png&bold=true`;

  return {
    url: fallbackUrl,
    sourcePageUrl: fallbackUrl,
    sourceTitle: "Generated fallback avatar",
    caption: `Fallback image for ${subject}`,
    confidence: "low",
  };
}

function extractTitle(html: string) {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match?.[1]?.trim() ?? "";
}

function resolveCandidateUrl(value: string, pageUrl: string) {
  if (!value || value.startsWith("data:")) return null;

  try {
    return new URL(value, pageUrl).toString();
  } catch {
    return null;
  }
}

function scoreImageCandidate({
  imageUrl,
  subject,
  sourceTitle,
  pageTitle,
  altText,
  isMetaTag,
}: {
  imageUrl: string;
  subject: string;
  sourceTitle: string;
  pageTitle: string;
  altText: string;
  isMetaTag: boolean;
}) {
  const haystack =
    `${imageUrl} ${sourceTitle} ${pageTitle} ${altText}`.toLowerCase();
  const tokens = subject
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3);

  let score = isMetaTag ? 60 : 36;

  for (const token of tokens) {
    if (haystack.includes(token)) {
      score += 10;
    }
  }

  if (
    /(logo|icon|favicon|sprite|banner|generic|placeholder|default|thumb)/i.test(
      haystack,
    )
  ) {
    score -= 20;
  }

  if (/\.(svg|ico)(\?|$)/i.test(imageUrl)) {
    score -= 25;
  }

  if (isMetaTag) {
    score += 12;
  }

  return score;
}

async function fetchHtml(pageUrl: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);

  try {
    const response = await fetch(pageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 RevealAI/1.0",
        Accept: "text/html,application/xhtml+xml",
      },
      cache: "no-store",
      signal: controller.signal,
    });

    const contentType = response.headers.get("content-type") || "";
    if (!response.ok || !contentType.includes("text/html")) {
      return null;
    }

    return (await response.text()).slice(0, 250_000);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function extractImagesFromPage({
  pageUrl,
  sourceTitle,
  subject,
}: {
  pageUrl: string;
  sourceTitle: string;
  subject: string;
}) {
  if (/\.pdf(\?|$)/i.test(pageUrl)) {
    return [] as Array<SearchReportImage & { score: number }>;
  }

  const html = await fetchHtml(pageUrl);
  if (!html) {
    return [] as Array<SearchReportImage & { score: number }>;
  }

  const pageTitle = extractTitle(html);
  const candidates: Array<SearchReportImage & { score: number }> = [];
  const seen = new Set<string>();

  const metaRegex =
    /<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]+content=["']([^"']+)["'][^>]*>/gi;
  let metaMatch: RegExpExecArray | null;
  while ((metaMatch = metaRegex.exec(html)) !== null) {
    const imageUrl = resolveCandidateUrl(metaMatch[1], pageUrl);
    if (!imageUrl || seen.has(imageUrl)) continue;
    seen.add(imageUrl);

    candidates.push({
      url: imageUrl,
      sourcePageUrl: pageUrl,
      sourceTitle,
      caption: `Public image surfaced from ${sourceTitle || getDomainLabel(pageUrl)}`,
      confidence: "medium",
      score: scoreImageCandidate({
        imageUrl,
        subject,
        sourceTitle,
        pageTitle,
        altText: "",
        isMetaTag: true,
      }),
    });
  }

  const imgRegex =
    /<img[^>]+src=["']([^"']+)["'][^>]*?(?:alt=["']([^"']*)["'])?[^>]*>/gi;
  let imageMatch: RegExpExecArray | null;
  while ((imageMatch = imgRegex.exec(html)) !== null) {
    const imageUrl = resolveCandidateUrl(imageMatch[1], pageUrl);
    if (!imageUrl || seen.has(imageUrl)) continue;
    seen.add(imageUrl);

    const altText = imageMatch[2] ?? "";
    const score = scoreImageCandidate({
      imageUrl,
      subject,
      sourceTitle,
      pageTitle,
      altText,
      isMetaTag: false,
    });

    if (score < 25) continue;

    candidates.push({
      url: imageUrl,
      sourcePageUrl: pageUrl,
      sourceTitle,
      caption:
        altText.trim() ||
        `Public image surfaced from ${sourceTitle || getDomainLabel(pageUrl)}`,
      confidence: score >= 65 ? "high" : score >= 42 ? "medium" : "low",
      score,
    });
  }

  return candidates.sort((left, right) => right.score - left.score).slice(0, 2);
}

async function enrichReportImages(
  report: SearchReport,
  seedImages: SearchReportImage[],
) {
  const pages = [
    ...report.imageLeads.map((lead) => ({
      pageUrl: lead.sourcePageUrl,
      sourceTitle: lead.sourceTitle,
    })),
    ...report.sources.map((source) => ({
      pageUrl: source.url,
      sourceTitle: source.title,
    })),
  ]
    .map((item) => ({
      pageUrl: normalizeUrl(item.pageUrl),
      sourceTitle: item.sourceTitle,
    }))
    .filter((item): item is { pageUrl: string; sourceTitle: string } =>
      Boolean(item.pageUrl),
    );

  const uniquePages = Array.from(
    new Map(pages.map((item) => [item.pageUrl, item])).values(),
  ).slice(0, MAX_SOURCE_PAGES_FOR_IMAGES);

  const pageResults = await Promise.all(
    uniquePages.map((item) =>
      extractImagesFromPage({
        pageUrl: item.pageUrl,
        sourceTitle: item.sourceTitle,
        subject: report.subject,
      }),
    ),
  );

  const scrapedImages = pageResults
    .flat()
    .sort((left, right) => right.score - left.score)
    .map(({ score: _score, ...image }) => image);

  const images = uniqueBy(
    [...seedImages, ...scrapedImages],
    (image) => image.url,
  ).slice(0, MAX_IMAGES);

  return images.length > 0 ? images : [getFallbackImage(report.subject)];
}

export async function POST(request: NextRequest) {
  try {
    const { query, userId, searchType, subjectName, location } =
      (await request.json()) as {
        query?: string;
        userId?: string;
        searchType?: string;
        subjectName?: string;
        location?: string;
      };

    if (!query) {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    if (!perplexityApiKey) {
      return NextResponse.json(
        { error: "Perplexity API key is not configured" },
        { status: 500 },
      );
    }

    const normalizedSearchType = normalizeReportSearchType(searchType);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("tier, status")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (subError) {
      console.error("Error checking subscription:", subError);
      return NextResponse.json(
        { error: "Could not verify subscription" },
        { status: 500 },
      );
    }

    const isPro =
      !!subscription &&
      (subscription.tier === "weekly" || subscription.tier === "yearly");

    if (!isPro) {
      return NextResponse.json(
        {
          error: "Pro subscription required",
          message:
            "Search is only available for Pro subscribers. Please upgrade to continue.",
        },
        { status: 403 },
      );
    }

    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const { count, error: countError } = await supabase
      .from("perplexity_searches")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", twentyFourHoursAgo.toISOString());

    if (countError) {
      console.error("Error counting searches:", countError);
    }

    const searchCount = count || 0;
    if (searchCount >= PRO_USER_DAILY_LIMIT) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: `You've reached your daily limit of ${PRO_USER_DAILY_LIMIT} searches. Please try again tomorrow.`,
          limit: PRO_USER_DAILY_LIMIT,
          remaining: 0,
          resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        { status: 429 },
      );
    }

    let activeStage: SearchStage = "primary_structured";
    let outputText = "";
    let modelUsed = PERPLEXITY_PRIMARY_MODEL;
    let discoveredSources: SearchReportSource[] = [];
    let relatedQuestions: string[] = [];
    let seedImages: SearchReportImage[] = [];

    while (true) {
      const runtimeProfile = getStageRuntimeProfile(
        activeStage,
        normalizedSearchType,
      );
      modelUsed = runtimeProfile.model;

      const systemPrompt = runtimeProfile.structured
        ? buildStructuredSystemPrompt(normalizedSearchType)
        : buildRevealSearchNarrativePrompt(normalizedSearchType);

      const requestBody = JSON.stringify({
        model: runtimeProfile.model,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: buildRevealSearchInput({
              query,
              searchType: normalizedSearchType,
              subjectName,
              location,
            }),
          },
        ],
        temperature: 0.2,
        max_tokens: runtimeProfile.maxTokens,
        return_images: true,
        return_related_questions: true,
        search_mode: "web",
      });

      const { response, errorText } =
        await perplexityRequestWithRetry(requestBody);

      if (!response.ok) {
        const resolvedErrorText = errorText || (await response.text());
        console.error("Perplexity API error:", resolvedErrorText);

        if (activeStage === "primary_structured") {
          activeStage = "fallback_narrative";
          continue;
        }

        return NextResponse.json(
          { error: getFriendlyPerplexityErrorMessage(resolvedErrorText) },
          { status: 502 },
        );
      }

      const data = (await response.json()) as PerplexityResponseShape;
      outputText = extractPerplexityContent(data);
      discoveredSources = buildDiscoveredSources(data);
      relatedQuestions = extractPerplexityRelatedQuestions(data);
      seedImages = buildSeedImages(
        extractPerplexityImageUrls(data),
        cleanText(subjectName) || query,
      );

      if (!outputText && activeStage === "primary_structured") {
        activeStage = "fallback_narrative";
        continue;
      }

      if (!outputText) {
        return NextResponse.json(
          {
            error: "The search completed but returned an empty report.",
            sourcesFound: discoveredSources.length,
          },
          { status: 404 },
        );
      }

      if (
        runtimeProfile.structured &&
        !parseStructuredReportDraft(outputText)
      ) {
        activeStage = "fallback_narrative";
        continue;
      }

      break;
    }

    let report: SearchReport;

    try {
      if (activeStage === "primary_structured") {
        const rawDraft = parseStructuredReportDraft(outputText);
        if (!rawDraft) {
          throw new Error("Structured output could not be parsed cleanly");
        }

        report = hydrateSearchReport({
          draft: mergeDraftSources(
            rawDraft as unknown as Record<string, unknown>,
            discoveredSources,
          ) as any,
          query,
          searchType: normalizedSearchType,
          subjectName,
        });
      } else {
        report = buildFallbackReportFromContent({
          content: outputText,
          subjectName,
          searchType: normalizedSearchType,
        });
      }
    } catch (error) {
      console.error("Failed to parse Perplexity search output:", error);
      report = buildFallbackReportFromContent({
        content: outputText,
        subjectName,
        searchType: normalizedSearchType,
      });
    }

    report = mergeSourcesIntoReport(report, discoveredSources);
    report = mergeFollowUpQueries(report, relatedQuestions);
    report.images = await enrichReportImages(report, seedImages);

    const content = buildReportText(report);

    await supabase.from("perplexity_searches").insert({
      user_id: userId,
      query,
      model: modelUsed,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      content,
      report,
      citations: report.sources.map((source) => source.url),
      images: report.images,
      relatedQuestions: report.followUpQueries,
      model: modelUsed,
      remaining: PRO_USER_DAILY_LIMIT - (searchCount + 1),
      limit: PRO_USER_DAILY_LIMIT,
      _debug: {
        provider: "perplexity",
        searchType: normalizedSearchType,
        searchStage: activeStage,
        sourceCount: report.sources.length,
        relatedQuestionCount: report.followUpQueries.length,
        imageCount: report.images.length,
      },
    });
  } catch (error: any) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: error.message || "Search failed" },
      { status: 500 },
    );
  }
}

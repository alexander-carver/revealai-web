import { getCanonicalSearchType } from "@/lib/search-routing";

export type ReportSearchType =
  | "fullreport"
  | "social"
  | "followers"
  | "phone"
  | "vehicle"
  | "records"
  | "privacy"
  | "username";

export type ReportTone = "neutral" | "positive" | "caution";
export type ReportConfidence = "high" | "medium" | "low";

export interface SearchReportHero {
  eyebrow: string;
  title: string;
  summary: string;
  confidenceLabel: string;
  matchAssessment: string;
  dataRichness: string;
}

export interface SearchReportQuickFact {
  label: string;
  value: string;
}

export interface SearchReportTakeaway {
  title: string;
  detail: string;
  tone: ReportTone;
  sourceUrls: string[];
}

export interface SearchReportSection {
  id: string;
  title: string;
  summary: string;
  paragraphs: string[];
  bullets: string[];
  sourceUrls: string[];
}

export interface SearchReportTimelineEvent {
  date: string;
  title: string;
  description: string;
  sourceUrl: string;
}

export interface SearchReportSource {
  title: string;
  url: string;
  domain: string;
  type: string;
  note: string;
}

export interface SearchReportImageLead {
  sourcePageUrl: string;
  sourceTitle: string;
  caption: string;
  confidence: ReportConfidence;
}

export interface SearchReportImage {
  url: string;
  sourcePageUrl: string;
  sourceTitle: string;
  caption: string;
  confidence: ReportConfidence;
}

export interface SearchReport {
  searchType: ReportSearchType;
  reportLabel: string;
  subject: string;
  rawQuery: string;
  generatedAt: string;
  hero: SearchReportHero;
  quickFacts: SearchReportQuickFact[];
  executiveSummary: SearchReportTakeaway[];
  sections: SearchReportSection[];
  timeline: SearchReportTimelineEvent[];
  sources: SearchReportSource[];
  imageLeads: SearchReportImageLead[];
  images: SearchReportImage[];
  followUpQueries: string[];
  caveats: string[];
}

function buildFallbackAvatar(subject: string): SearchReportImage {
  const url = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    subject,
  )}&size=900&background=0f172a&color=ffffff&format=png&bold=true`;

  return {
    url,
    sourcePageUrl: url,
    sourceTitle: "Generated fallback avatar",
    caption: `Fallback image for ${subject}`,
    confidence: "low",
  };
}

interface SearchReportDraft {
  hero: SearchReportHero;
  quickFacts: SearchReportQuickFact[];
  executiveSummary: SearchReportTakeaway[];
  sections: SearchReportSection[];
  timeline: SearchReportTimelineEvent[];
  sources: Array<{
    title: string;
    url: string;
    type: string;
    note: string;
  }>;
  imageLeads: SearchReportImageLead[];
  followUpQueries: string[];
  caveats: string[];
}

export interface RevealSearchRequest {
  query: string;
  userId?: string | null;
  usePro?: boolean;
  isPro?: boolean;
  searchType?: string | null;
  subjectName?: string | null;
  location?: string | null;
}

export interface RevealSearchResponse {
  success: true;
  content: string;
  report: SearchReport;
  citations: string[];
  images: SearchReportImage[];
  relatedQuestions: string[];
  model: string;
  remaining: number;
  limit: number;
  _debug?: Record<string, unknown>;
}

interface PendingRevealSearchResponse {
  pending: true;
  responseId: string;
  status: string;
  pollAfterMs?: number;
  searchStage?: string;
}

interface SearchPromptConfig {
  label: string;
  focus: string;
  sections: string[];
  followUps: (subject: string) => string[];
}

const SEARCH_PROMPT_CONFIG: Record<ReportSearchType, SearchPromptConfig> = {
  fullreport: {
    label: "Full Report",
    focus:
      "Build the strongest public-identity match, cover biography and career, surface education and affiliations, note public coverage or controversies with careful verification, and explain what confidence or ambiguity remains.",
    sections: [
      "Identity Match",
      "Biography and Background",
      "Career, Education, and Affiliations",
      "Media, Coverage, and Public Signals",
      "Related People, Organizations, and Places",
    ],
    followUps: (subject) => [
      `What professional history stands out most for ${subject}?`,
      `What public records or controversies are most relevant to ${subject}?`,
      `What social profiles or online signals are tied to ${subject}?`,
      `Which organizations or people are most connected to ${subject}?`,
    ],
  },
  social: {
    label: "Dating Apps Search",
    focus:
      "Prioritize dating safety, public social accounts, usernames, linked profiles, relationship signals, public comments or replies, tagged interactions, mentions, visible engagement trails, inconsistencies, catfish indicators, and what is or is not publicly verifiable.",
    sections: [
      "Best-Match Account Summary",
      "Public Social Accounts",
      "Dating and Relationship Signals",
      "Public Activity, Mentions, and Comment Trails",
      "Identity Consistency and Red Flags",
      "Visibility Limits",
    ],
    followUps: (subject) => [
      `What usernames or handles appear most strongly tied to ${subject}?`,
      `What public comments, tags, or interaction trails appear tied to ${subject}?`,
      `What catfish or inconsistency signals show up around ${subject}?`,
      `Which public profiles appear most relevant for ${subject}?`,
      `What relationship-related signals are publicly visible for ${subject}?`,
    ],
  },
  followers: {
    label: "Followers Search",
    focus:
      "Analyze public follower and following patterns, apparent one-sided follows, suspicious clusters, burner-style accounts, interest-pattern anomalies, and visibility gaps without overstating certainty.",
    sections: [
      "Accounts Found",
      "Follow-Back and One-Sided Patterns",
      "Suspicious Cluster Review",
      "Behavioral Signals",
      "Visibility Limits",
    ],
    followUps: (subject) => [
      `Which one-sided follows matter most for ${subject}?`,
      `What suspicious account clusters stand out around ${subject}?`,
      `What public audience or following patterns look unusual for ${subject}?`,
      `What could not be verified publicly about ${subject}'s follower graph?`,
    ],
  },
  phone: {
    label: "Reverse Phone Lookup",
    focus:
      "Prioritize likely owner identity, location, carrier or line-type clues, spam and scam reputation, public listings, and the confidence or uncertainty around the match.",
    sections: [
      "Owner Match",
      "Carrier and Number Details",
      "Spam, Scam, and Reputation Signals",
      "Public Listings and Associations",
      "Safety Assessment",
    ],
    followUps: (subject) => [
      `What spam or scam reports are tied to ${subject}?`,
      `What public people or businesses are associated with ${subject}?`,
      `How strong is the ownership match for ${subject}?`,
      `What should someone verify before trusting ${subject}?`,
    ],
  },
  vehicle: {
    label: "Vehicle Lookup",
    focus:
      "Prioritize VIN or plate identity, vehicle specs, manufacturer details, body and engine data, recall or marketplace context, and what can or cannot be firmly confirmed from the identifier provided.",
    sections: [
      "Vehicle Identity Snapshot",
      "Core Specs and Trim Signals",
      "Manufacturer and Build Context",
      "Safety, Recall, and Marketplace Signals",
      "Verification Notes",
    ],
    followUps: (subject) => [
      `What core specs are best supported for ${subject}?`,
      `What recall, safety, or defect context matters for ${subject}?`,
      `What listing or resale checks should someone run for ${subject}?`,
      `What details remain uncertain from ${subject} alone?`,
    ],
  },
  records: {
    label: "Records Search",
    focus:
      "Prioritize criminal, civil, traffic, bankruptcy, lien, judgment, and registry-related coverage; separate verified records from lack of public findings; and emphasize jurisdictions and caveats.",
    sections: [
      "Record Search Snapshot",
      "Criminal, Civil, and Traffic Coverage",
      "Financial and Filing Records",
      "Registry Checks and Jurisdiction Notes",
      "Coverage Limits",
    ],
    followUps: (subject) => [
      `Which jurisdictions matter most for ${subject}'s record search?`,
      `What criminal or civil records are the strongest public matches for ${subject}?`,
      `What financial filings or judgments show up for ${subject}?`,
      `What record categories were not publicly verifiable for ${subject}?`,
    ],
  },
  privacy: {
    label: "Privacy Scan",
    focus:
      "Prioritize data-broker exposure, personal data types exposed, breach or leak mentions, public social oversharing, removal opportunities, and an overall privacy risk assessment.",
    sections: [
      "Exposure Snapshot",
      "Data Broker and Directory Exposure",
      "Public Data Categories Exposed",
      "Risk Rating and Why",
      "Action Plan",
    ],
    followUps: (subject) => [
      `Which data brokers appear most urgent for ${subject} to remove?`,
      `What exposed data creates the biggest privacy risk for ${subject}?`,
      `What removal steps would reduce ${subject}'s exposure fastest?`,
      `What public records or social accounts are driving ${subject}'s risk score?`,
    ],
  },
  username: {
    label: "Username Search",
    focus:
      "Prioritize cross-platform username matches, strongest identity linkages, account similarities, public comments or replies, mentions, tagged interactions, platform coverage, and what is publicly verifiable versus only suggestive.",
    sections: [
      "Cross-Platform Match Summary",
      "Strongest Account Matches",
      "Identity Linkage Signals",
      "Public Activity and Interaction Trails",
      "Platform Coverage and Gaps",
      "Risk or Trust Signals",
    ],
    followUps: (subject) => [
      `Which platforms have the strongest match for ${subject}?`,
      `What identity-linkage signals connect the accounts for ${subject}?`,
      `What public comments, mentions, or tagged interactions show up for ${subject}?`,
      `What suspicious or inconsistent profile details show up for ${subject}?`,
      `What platforms did not show a verifiable match for ${subject}?`,
    ],
  },
};

export const SEARCH_REPORT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "hero",
    "quickFacts",
    "executiveSummary",
    "sections",
    "timeline",
    "sources",
    "imageLeads",
    "followUpQueries",
    "caveats",
  ],
  properties: {
    hero: {
      type: "object",
      additionalProperties: false,
      required: [
        "eyebrow",
        "title",
        "summary",
        "confidenceLabel",
        "matchAssessment",
        "dataRichness",
      ],
      properties: {
        eyebrow: { type: "string" },
        title: { type: "string" },
        summary: { type: "string" },
        confidenceLabel: { type: "string" },
        matchAssessment: { type: "string" },
        dataRichness: { type: "string" },
      },
    },
    quickFacts: {
      type: "array",
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["label", "value"],
        properties: {
          label: { type: "string" },
          value: { type: "string" },
        },
      },
    },
    executiveSummary: {
      type: "array",
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "detail", "tone", "sourceUrls"],
        properties: {
          title: { type: "string" },
          detail: { type: "string" },
          tone: {
            type: "string",
            enum: ["neutral", "positive", "caution"],
          },
          sourceUrls: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
    },
    sections: {
      type: "array",
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "id",
          "title",
          "summary",
          "paragraphs",
          "bullets",
          "sourceUrls",
        ],
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          summary: { type: "string" },
          paragraphs: {
            type: "array",
            items: { type: "string" },
          },
          bullets: {
            type: "array",
            items: { type: "string" },
          },
          sourceUrls: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
    },
    timeline: {
      type: "array",
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["date", "title", "description", "sourceUrl"],
        properties: {
          date: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          sourceUrl: { type: "string" },
        },
      },
    },
    sources: {
      type: "array",
      maxItems: 14,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "url", "type", "note"],
        properties: {
          title: { type: "string" },
          url: { type: "string" },
          type: { type: "string" },
          note: { type: "string" },
        },
      },
    },
    imageLeads: {
      type: "array",
      maxItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["sourcePageUrl", "sourceTitle", "caption", "confidence"],
        properties: {
          sourcePageUrl: { type: "string" },
          sourceTitle: { type: "string" },
          caption: { type: "string" },
          confidence: {
            type: "string",
            enum: ["high", "medium", "low"],
          },
        },
      },
    },
    followUpQueries: {
      type: "array",
      maxItems: 6,
      items: { type: "string" },
    },
    caveats: {
      type: "array",
      maxItems: 4,
      items: { type: "string" },
    },
  },
} as const;

export function normalizeReportSearchType(
  value?: string | null,
): ReportSearchType {
  const raw = (value ?? "").trim().toLowerCase();

  if (raw === "privacy" || raw === "privacyscan") {
    return "privacy";
  }

  if (raw === "username" || raw === "usernamesearch") {
    return "username";
  }

  const canonical = getCanonicalSearchType(value);

  if (canonical === "social") return "social";
  if (canonical === "followers") return "followers";
  if (canonical === "phone") return "phone";
  if (canonical === "vehicle") return "vehicle";
  if (canonical === "records") return "records";
  if (canonical === "fullreport") return "fullreport";

  return "fullreport";
}

export function getReportLabel(searchType?: string | null) {
  return SEARCH_PROMPT_CONFIG[normalizeReportSearchType(searchType)].label;
}

export function buildRevealSearchSystemPrompt(searchType?: string | null) {
  const normalized = normalizeReportSearchType(searchType);
  const config = SEARCH_PROMPT_CONFIG[normalized];
  const qualityNote = getSearchSpecificQualityNotes(normalized);

  return `You are RevealAI, an open-ended public-information research assistant. Produce the strongest possible public-web report for the requested subject while staying factual, clearly sourced, and useful enough to feel premium.

Core behavior:
- Work like a hybrid of an investigative researcher, analyst, and search-results curator.
- Use web search proactively. Prefer official pages, reputable media, directories, databases, public profiles, and primary-source documents when possible.
- Compare publish dates and event dates. Use absolute dates such as "March 12, 2026" when mentioning time-sensitive facts.
- If multiple identities share a name, pick the best-supported match, explain the match reasoning clearly, and say what ambiguity remains.
- If information is sparse or conflicting, still return a useful report. Be explicit about uncertainty and visibility limits.
- Never include private contact information, home addresses, SSNs, or non-public PII.
- Distinguish verified information from rumor, speculation, forums, or tabloids. If a claim is unverified, label it plainly.
- Do not output markdown tables. Do not output JSON outside the required schema. Keep prose clean and readable.

Coverage expectations for this search:
- Search type: ${config.label}
- Primary focus: ${config.focus}
- Prioritized section themes: ${config.sections.join("; ")}

Output requirements:
- Make the hero summary polished and concise.
- Fill quickFacts with short, high-value scan points.
- Fill executiveSummary with 3 to 5 sharp takeaways that provide real value fast.
- Fill sections with detailed, natural-language paragraphs plus bullets when they help scanning. Prioritize depth over quantity and keep the total section count focused.
- Fill timeline with dateable events only; otherwise return an empty array.
- Fill sources with 8 to 14 useful URLs, each with a short note explaining why it matters.
- Fill imageLeads with the source pages most likely to contain the subject's image or profile photo. Prefer official biographies, public social profiles, reputable media pages, and directories with likely subject imagery. Return 2 to 4 leads when plausible.
- Fill followUpQueries with 4 to 6 helpful next searches tailored to this search type.
- Fill caveats with the most important confidence or visibility limitations.

Quality bar:
- Prioritize detail, clarity, and value.
- Make the report feel like a premium analyst brief, not generic search snippets.
- Avoid filler. Every section should teach the user something concrete.
- Write with confident, editorial language. Avoid first-person hedging like "I could not verify" and avoid raw labels like "low confidence". When coverage is thin, frame it as a selective public footprint or a narrow source set while still naming the strongest supported match.
- Never tell the user that another tool, paid database, outside service, or different product would do a better job. Provide the strongest answer possible from the evidence surfaced in this run.
${qualityNote ? `${qualityNote}\n` : ""}`;
}

export function buildRevealSearchNarrativePrompt(searchType?: string | null) {
  const normalized = normalizeReportSearchType(searchType);
  const config = SEARCH_PROMPT_CONFIG[normalized];
  const qualityNote = getSearchSpecificQualityNotes(normalized);

  return `You are RevealAI, an open-ended public-information research assistant. Produce a premium public-web report in plain text with markdown headings.

Core behavior:
- Use web search proactively and prioritize official pages, reputable media, public directories, public profiles, and primary-source documents when possible.
- Use absolute dates when mentioning time-sensitive facts.
- If multiple identities share a name, explain which match you chose and why.
- Distinguish verified information from rumor or speculation.
- Never include private contact information, home addresses, SSNs, or non-public PII.

Formatting requirements:
- Do not output JSON.
- Use markdown headings in this rough shape:
  ## Summary
  ## Key Findings
  ## Detailed Findings
  ## Timeline
  ## Sources
  ## Coverage Notes
- In Sources, include 8 to 14 markdown bullet links in the form:
  - [Source title](https://example.com): why it matters
- Keep the report rich, readable, and premium, but compact enough to complete reliably.

Coverage expectations:
- Search type: ${config.label}
- Primary focus: ${config.focus}
- Prioritized section themes: ${config.sections.join("; ")}

Quality bar:
- Maximize useful detail.
- Prefer concrete findings over filler.
- If coverage is thin, frame it as a selective public footprint and still return the strongest public-web brief you can.
- Avoid first-person hedging such as "I could not verify"; write in a confident analyst voice.
- Never tell the user to use another tool, paid database, outside service, or different product. Stay inside the evidence surfaced in this run and make the answer as useful as possible.
${qualityNote ? `${qualityNote}\n` : ""}`;
}

export function buildRevealSearchInput({
  query,
  searchType,
  subjectName,
  location,
}: {
  query: string;
  searchType?: string | null;
  subjectName?: string | null;
  location?: string | null;
}) {
  const normalized = normalizeReportSearchType(searchType);
  const config = SEARCH_PROMPT_CONFIG[normalized];

  return [
    `Search type: ${config.label}`,
    subjectName ? `Primary subject: ${subjectName}` : null,
    location ? `Location hint: ${location}` : null,
    `User request: ${query}`,
    "Important formatting notes:",
    "- Keep prose plain; do not embed markdown links in paragraphs.",
    "- Put URLs in sources or sourceUrls fields.",
    "- If no hard evidence exists for a category, say so instead of guessing.",
  ]
    .filter(Boolean)
    .join("\n");
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

function cleanText(value: string | undefined | null) {
  if (!value) return "";

  return value
    .replace(/\s+/g, " ")
    .replace(/\*\*/g, "")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .trim();
}

function polishReportSentence(value: string, subject: string) {
  let text = cleanText(value);
  if (!text) return "";

  if (/^public-information brief (generated )?for /i.test(text)) {
    return text.replace(
      /^public-information brief (generated )?for /i,
      "Source-backed brief for ",
    );
  }

  if (/^fallback rendering from existing report content$/i.test(text)) {
    return "Structured from the strongest available public signals on this run.";
  }

  if (
    /^this report was rendered from legacy text content/i.test(text) ||
    /^this report was reconstructed from malformed structured output/i.test(
      text,
    )
  ) {
    return "This brief was assembled from the strongest narrative source material available on this run, so some structured fields were streamlined for clarity.";
  }

  if (/^coverage depends on what is publicly visible/i.test(text)) {
    return "This brief reflects the public-web record available on this run and is designed to foreground the strongest visible signals first.";
  }

  if (/^i could not verify a strong public-identity match/i.test(text)) {
    return `This brief centers on a narrow public-web footprint tied to ${subject}. ${text.replace(
      /^i could not verify a strong public-identity match[^.]*\.\s*/i,
      "",
    )}`.trim();
  }

  if (/^i could not verify/i.test(text) || /^i couldn't verify/i.test(text)) {
    return text
      .replace(/^i could not verify/i, "Public coverage does not establish")
      .replace(/^i couldn't verify/i, "Public coverage does not establish");
  }

  if (/^no strong match for /i.test(text)) {
    return `This brief centers on the strongest public-web traces tied to ${subject}. ${text.replace(
      /^no strong match[^.]*\.\s*/i,
      "",
    )}`.trim();
  }

  if (/^i found no verifiable /i.test(text)) {
    return text.replace(
      /^i found no verifiable /i,
      "The visible public-web record does not establish ",
    );
  }

  if (/paid services may have owner data not visible here/i.test(text)) {
    return `The open-web record on this run does not surface a fully corroborated owner for ${subject}, so the strongest read comes from the visible source overlap, directory coverage, and associated public signals.`;
  }

  if (/free tools/i.test(text) && /phone records change/i.test(text)) {
    return "Phone ownership can change over time, and some numbers leave only a partial public trail, so the strongest read should come from the overlap that repeats across visible sources.";
  }

  if (/sparse results typical for private or mobile numbers/i.test(text)) {
    return "Private and mobile numbers often leave a lighter public trail, and spoofing remains a live possibility when ownership evidence is thin.";
  }

  if (/other tools/i.test(text)) {
    return text.replace(
      /\bother tools\b/gi,
      "other visible source categories",
    );
  }

  return text
    .replace(/\blow confidence\b/gi, "selective match")
    .replace(/\blimited confidence\b/gi, "selective match")
    .replace(/\blow-to-moderate confidence\b/gi, "selective lead")
    .replace(/\bmoderate confidence\b/gi, "lead match")
    .replace(/\blimited public coverage\b/gi, "selective public footprint")
    .replace(
      /\blimited structured source coverage\b/gi,
      "selective structured coverage",
    )
    .replace(/\blimited public data\b/gi, "selective public data")
    .replace(/\blimited public footprint\b/gi, "selective public footprint");
}

function polishConfidenceLabel(value: string | undefined | null) {
  const text = cleanText(value).toLowerCase();

  if (!text) return "Lead match";
  if (text.includes("high")) return "Strong match";
  if (text.includes("low-to-moderate") || text.includes("limited")) {
    return "Selective lead";
  }
  if (text.includes("moderate")) return "Lead match";
  if (text.includes("low")) return "Selective lead";
  return cleanText(value);
}

function polishCoverageLabel(value: string | undefined | null) {
  const text = cleanText(value);
  const normalized = text.toLowerCase();

  if (!text) return "Selective public footprint";
  if (normalized.includes("limited structured")) return "Focused source set";
  if (normalized.includes("limited public coverage"))
    return "Selective public footprint";
  if (normalized.includes("limited public data"))
    return "Selective public footprint";
  if (normalized.includes("moderate public coverage"))
    return "Developed public footprint";
  if (normalized.includes("sources extracted")) return text;
  return text;
}

function getSourceDomains(
  sources: Array<{ domain?: string; url?: string } | null | undefined>,
) {
  return uniqueBy(
    sources
      .map((source) => {
        const directDomain = cleanText(source?.domain);
        if (directDomain) {
          return directDomain.replace(/^www\./, "");
        }

        const normalizedUrl = normalizeUrl(source?.url);
        if (!normalizedUrl) return null;

        try {
          return new URL(normalizedUrl).hostname.replace(/^www\./, "");
        } catch {
          return null;
        }
      })
      .filter(Boolean) as string[],
    (domain) => domain.toLowerCase(),
  );
}

function formatDomainList(domains: string[]) {
  if (domains.length === 0) return "visible public sources";
  if (domains.length === 1) return domains[0];
  if (domains.length === 2) return `${domains[0]} and ${domains[1]}`;
  return `${domains.slice(0, -1).join(", ")}, and ${domains.at(-1)}`;
}

function getDefaultCoverageLabel(
  searchType: ReportSearchType,
  sourceCount: number,
  sourceDomains: string[],
) {
  if (searchType === "phone") {
    if (sourceCount >= 6) return "Cross-checked number footprint";
    if (sourceCount >= 3) return "Directory-led number footprint";
    return "Selective number footprint";
  }

  if (searchType === "vehicle") {
    if (sourceCount >= 4) return "Identifier-backed vehicle footprint";
    return "Selective identifier footprint";
  }

  if (searchType === "username") {
    if (sourceCount >= 5) return "Cross-platform handle footprint";
    return "Selective handle footprint";
  }

  if (searchType === "social" || searchType === "followers") {
    if (sourceDomains.some((domain) => /instagram|facebook|tiktok|x\.com|twitter|reddit|linkedin/.test(domain))) {
      return "Cross-platform public footprint";
    }
    return "Selective social footprint";
  }

  if (searchType === "fullreport") {
    if (sourceCount >= 8) return "Developed public footprint";
    if (sourceCount >= 4) return "Layered public footprint";
    return "Selective public footprint";
  }

  if (searchType === "records") {
    return sourceCount >= 4 ? "Cross-checked record footprint" : "Selective record footprint";
  }

  if (searchType === "privacy") {
    return sourceCount >= 4 ? "Exposure-led source set" : "Selective exposure footprint";
  }

  return sourceCount >= 4 ? "Layered public footprint" : "Selective public footprint";
}

function getDefaultSummaryText({
  searchType,
  subject,
  sourceCount,
  sourceDomains,
}: {
  searchType: ReportSearchType;
  subject: string;
  sourceCount: number;
  sourceDomains: string[];
}) {
  const domainList = formatDomainList(sourceDomains.slice(0, 3));

  switch (searchType) {
    case "fullreport":
      return sourceCount > 0
        ? `This full report centers on the strongest public identity match tied to ${subject}, combining biography, affiliations, public coverage, and source overlap from ${domainList}.`
        : `This full report centers on the strongest public identity signals tied to ${subject}, with emphasis on biography, affiliations, and the clearest source-backed context available on this run.`;
    case "social":
      return sourceCount > 0
        ? `This dating and social search centers on the strongest public-web footprint tied to ${subject}, with emphasis on visible profiles, relationship-adjacent signals, and interaction traces surfaced from ${domainList}.`
        : `This dating and social search centers on the strongest public-web footprint tied to ${subject}, with emphasis on visible profiles, relationship-adjacent signals, and interaction trails.`;
    case "followers":
      return sourceCount > 0
        ? `This followers search centers on the strongest public social accounts tied to ${subject}, focusing on follow-pattern signals, visible audience clues, and source overlap from ${domainList}.`
        : `This followers search centers on the strongest public social accounts tied to ${subject}, focusing on follow-pattern signals and visible audience clues.`;
    case "phone":
      return sourceCount > 0
        ? `This reverse phone lookup centers on what ${subject} is tied to right now across ${domainList}, with emphasis on ownership clues, directory overlap, reputation signals, and associated people or businesses where visible.`
        : `This reverse phone lookup centers on the strongest visible clues tied to ${subject}, with emphasis on ownership, carrier, location, and spam-reputation signals.`;
    case "vehicle":
      return sourceCount > 0
        ? `This vehicle lookup centers on the strongest identifier-backed read for ${subject}, combining decode details, manufacturer context, and supporting vehicle references surfaced from ${domainList}.`
        : `This vehicle lookup centers on the strongest identifier-backed read for ${subject}, combining decode details, manufacturer context, and resale or safety signals where visible.`;
    case "records":
      return sourceCount > 0
        ? `This records search centers on the strongest public filing and jurisdiction signals tied to ${subject}, with the clearest coverage pulled forward from ${domainList}.`
        : `This records search centers on the strongest public filing and jurisdiction signals tied to ${subject}.`;
    case "privacy":
      return sourceCount > 0
        ? `This privacy scan centers on the strongest public exposure signals tied to ${subject}, drawing first from ${domainList} and the clearest open-web traces available on this run.`
        : `This privacy scan centers on the strongest public exposure signals tied to ${subject}.`;
    case "username":
      return sourceCount > 0
        ? `This username search centers on the strongest public account matches tied to ${subject}, with emphasis on cross-platform overlap, profile linkage signals, and visible interaction trails surfaced from ${domainList}.`
        : `This username search centers on the strongest public account matches tied to ${subject}, with emphasis on cross-platform overlap, profile linkage signals, and visible interaction trails.`;
    default:
      return `This brief centers on the strongest public signals tied to ${subject}.`;
  }
}

function getDefaultMatchAssessmentText({
  searchType,
  subject,
  sourceCount,
}: {
  searchType: ReportSearchType;
  subject: string;
  sourceCount: number;
}) {
  switch (searchType) {
    case "phone":
      return sourceCount > 0
        ? `The strongest read on ${subject} comes from overlapping reverse-lookup and directory coverage rather than a single isolated page.`
        : `The strongest read on ${subject} depends on line-type, location, and public association signals captured on this run.`;
    case "vehicle":
      return `The strongest read on ${subject} comes from the identifier itself first, with supporting context layered in where public sources corroborate it.`;
    case "username":
      return `The strongest read on ${subject} comes from cross-platform handle reuse, profile similarity, and public interaction traces that point toward the same identity.`;
    case "social":
      return `The strongest read on ${subject} comes from public-profile overlap, visible social activity, and relationship-adjacent signals that repeat across sources.`;
    case "fullreport":
      return `The strongest read on ${subject} comes from the densest cluster of source overlap rather than any single standalone mention.`;
    default:
      return `The strongest read on ${subject} comes from the clearest source overlap surfaced on this run.`;
  }
}

function getSourceDrivenParagraph({
  searchType,
  subject,
  sources,
}: {
  searchType: ReportSearchType;
  subject: string;
  sources: SearchReportSource[];
}) {
  const sourceDomains = getSourceDomains(sources);
  const domainList = formatDomainList(sourceDomains.slice(0, 4));

  if (sources.length === 0) {
    switch (searchType) {
      case "phone":
        return `The public-web record around ${subject} is thin on this run, so the strongest value comes from how the number is classified, where it appears geographically, and whether any repeated associations surface across the available pages.`;
      case "vehicle":
        return `The strongest value around ${subject} comes from the identifier-backed vehicle read itself, with any extra safety, recall, or listing context depending on what public references surfaced on this run.`;
      default:
        return `This brief is anchored to the strongest public-web evidence surfaced on this run, even where coverage is selective.`;
    }
  }

  switch (searchType) {
    case "phone":
      return `${subject} surfaced across ${sources.length} public source${sources.length === 1 ? "" : "s"}, led by ${domainList}. That pattern usually points to a real reverse-lookup footprint, even when the open web does not surface a single fully corroborated owner page.`;
    case "vehicle":
      return `${subject} surfaced across ${sources.length} source${sources.length === 1 ? "" : "s"}, led by ${domainList}. The strongest reading should center on identifier-backed vehicle facts first, then any supporting marketplace, reference, or safety context layered around them.`;
    case "username":
      return `${subject} surfaced across ${sources.length} source${sources.length === 1 ? "" : "s"}, led by ${domainList}. That kind of overlap is most useful when the same handle, imagery, bios, or interaction patterns repeat across platforms.`;
    case "social":
      return `${subject} surfaced across ${sources.length} source${sources.length === 1 ? "" : "s"}, led by ${domainList}. The most useful read comes from repeated profile clues, public engagement traces, and identity-consistency signals that show up across more than one source.`;
    default:
      return `${subject} surfaced across ${sources.length} source${sources.length === 1 ? "" : "s"}, led by ${domainList}. The strongest conclusions should come from what repeats across that source set, not from isolated mentions.`;
  }
}

function getSearchSpecificQualityNotes(searchType: ReportSearchType) {
  switch (searchType) {
    case "fullreport":
      return "- For Full Report, write a materially developed narrative answer. It should feel substantial, with richer synthesis across biography, affiliations, chronology, public visibility, and source overlap.";
    case "phone":
      return "- For Reverse Phone Lookup, state the strongest current owner, household, business, or number association first. If a direct owner is not firmly corroborated, explain what the number is tied to now: carrier or line type, geography, directory footprint, spam reputation, recurring associations, and why those signals matter.";
    case "vehicle":
      return "- For Vehicle Lookup, state the strongest identifier-backed vehicle read first: likely year, make, model, trim/body/engine context, manufacturer details, recall or safety context, and what the identifier most strongly supports right now.";
    case "social":
      return "- For Dating Apps Search, actively look for public comments, replies, mentions, tagged interactions, forum posts, and visible engagement trails, not just profile pages.";
    case "username":
      return "- For Username Search, go beyond profile URLs and include public comments, mentions, tagged posts, reply trails, forum activity, and other visible interaction signals tied to the handle.";
    default:
      return "";
  }
}

function stripCodeFences(value: string) {
  return value
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function decodeEscapedJsonString(value: string) {
  try {
    return JSON.parse(`"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`);
  } catch {
    return value
      .replace(/\\"/g, '"')
      .replace(/\\n/g, " ")
      .replace(/\\t/g, " ")
      .replace(/\\\\/g, "\\");
  }
}

function looksLikeStructuredReportContent(value: string) {
  return /"hero"\s*:|"quickFacts"\s*:|"executiveSummary"\s*:|"sections"\s*:|"sources"\s*:/i.test(
    value,
  );
}

function unwrapParsedDraft(value: unknown): SearchReportDraft | null {
  if (!value) return null;

  if (typeof value === "string") {
    return parseStructuredReportDraft(value);
  }

  if (Array.isArray(value) || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;

  if (record.hero || record.sections || record.sources || record.quickFacts) {
    return record as unknown as SearchReportDraft;
  }

  if (record.report) {
    return unwrapParsedDraft(record.report);
  }

  if (record.data) {
    return unwrapParsedDraft(record.data);
  }

  return null;
}

export function parseStructuredReportDraft(
  value: string,
): SearchReportDraft | null {
  const normalized = stripCodeFences(value);
  const candidates = [normalized];

  const firstBrace = normalized.indexOf("{");
  const lastBrace = normalized.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    candidates.push(normalized.slice(firstBrace, lastBrace + 1));
  }

  for (const candidate of Array.from(new Set(candidates.filter(Boolean)))) {
    try {
      const parsed = JSON.parse(candidate);
      const unwrapped = unwrapParsedDraft(parsed);
      if (unwrapped) {
        return unwrapped;
      }
    } catch {
      // Continue to next parse candidate.
    }
  }

  return null;
}

function extractJsonStringField(content: string, field: string) {
  const match = content.match(
    new RegExp(`"${field}"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`, "i"),
  );
  return match ? cleanText(decodeEscapedJsonString(match[1])) : "";
}

function extractJsonFactPairs(content: string) {
  const facts: SearchReportQuickFact[] = [];
  const regex =
    /"label"\s*:\s*"((?:\\.|[^"\\])*)"\s*,\s*"value"\s*:\s*"((?:\\.|[^"\\])*)"/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    const label = cleanText(decodeEscapedJsonString(match[1]));
    const value = cleanText(decodeEscapedJsonString(match[2]));
    if (label && value) {
      facts.push({ label, value });
    }
  }

  return uniqueBy(facts, (fact) =>
    `${fact.label}:${fact.value}`.toLowerCase(),
  ).slice(0, 8);
}

function extractSalvageParagraphs(content: string, exclude: string[]) {
  const paragraphs: string[] = [];
  const regex = /"((?:\\.|[^"\\]){24,})"/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    const value = cleanText(decodeEscapedJsonString(match[1]));
    if (!value) continue;
    if (exclude.some((item) => item && value.includes(item))) continue;
    if (
      /^(hero|eyebrow|title|summary|confidenceLabel|matchAssessment|dataRichness)$/i.test(
        value,
      )
    ) {
      continue;
    }
    if (/^(high|medium|low|neutral|positive|caution)$/i.test(value)) {
      continue;
    }
    paragraphs.push(value);
  }

  return uniqueBy(paragraphs, (value) => value.toLowerCase()).slice(0, 6);
}

function buildSalvagedStructuredFallback({
  content,
  subjectName,
  searchType,
}: {
  content: string;
  subjectName?: string | null;
  searchType?: string | null;
}) {
  const normalizedSearchType = normalizeReportSearchType(searchType);
  const label = getReportLabel(normalizedSearchType);
  const subject =
    cleanText(subjectName) ||
    extractJsonStringField(content, "title") ||
    "Search subject";
  const sources = extractLinks(content);
  const sourceDomains = getSourceDomains(sources);
  const summary = polishReportSentence(
    extractJsonStringField(content, "summary") ||
      cleanText(content).slice(0, 280) ||
      getDefaultSummaryText({
        searchType: normalizedSearchType,
        subject,
        sourceCount: sources.length,
        sourceDomains,
      }),
    subject,
  );
  const confidenceLabel = polishConfidenceLabel(
    extractJsonStringField(content, "confidenceLabel") || "Selective lead",
  );
  const matchAssessment = polishReportSentence(
    extractJsonStringField(content, "matchAssessment") ||
      getDefaultMatchAssessmentText({
        searchType: normalizedSearchType,
        subject,
        sourceCount: sources.length,
      }),
    subject,
  );
  const dataRichness = polishCoverageLabel(
    extractJsonStringField(content, "dataRichness") ||
      getDefaultCoverageLabel(
        normalizedSearchType,
        sources.length,
        sourceDomains,
      ),
  );
  const quickFacts = extractJsonFactPairs(content);
  const extractedParagraphs = extractSalvageParagraphs(content, [
    summary,
    matchAssessment,
    confidenceLabel,
    dataRichness,
  ]);

  const sectionParagraphs = extractedParagraphs.filter(
    (paragraph) => paragraph.length >= 60 && paragraph !== summary,
  );

  return {
    searchType: normalizedSearchType,
    reportLabel: label,
    subject,
    rawQuery: subject,
    generatedAt: new Date().toISOString(),
    hero: {
      eyebrow: extractJsonStringField(content, "eyebrow") || label,
      title: `${label} for ${subject}`,
      summary,
      confidenceLabel,
      matchAssessment,
      dataRichness,
    },
    quickFacts:
      quickFacts.length > 0
        ? quickFacts
        : [
            { label: "Search Type", value: label },
            { label: "Coverage", value: dataRichness },
            { label: "Sources", value: String(sources.length) },
          ],
    executiveSummary: [
      {
        title: "Reconstructed summary",
        detail: summary,
        tone: "neutral" as const,
        sourceUrls: sources.slice(0, 3).map((source) => source.url),
      },
      {
        title: "Source read",
        detail: getSourceDrivenParagraph({
          searchType: normalizedSearchType,
          subject,
          sources,
        }),
        tone: "neutral" as const,
        sourceUrls: sources.slice(0, 4).map((source) => source.url),
      },
      ...(sectionParagraphs[0]
        ? [
            {
              title: "Strongest public signal",
              detail: polishReportSentence(sectionParagraphs[0], subject),
              tone: "neutral" as const,
              sourceUrls: sources.slice(0, 2).map((source) => source.url),
            },
          ]
        : []),
    ],
    sections: [
      {
        id: "identity-match",
        title: "Identity Match",
        summary,
        paragraphs: [summary, matchAssessment]
          .map((paragraph) => polishReportSentence(paragraph, subject))
          .filter(Boolean),
        bullets: quickFacts
          .map((fact) =>
            polishReportSentence(`${fact.label}: ${fact.value}`, subject),
          )
          .filter(Boolean),
        sourceUrls: sources.slice(0, 4).map((source) => source.url),
      },
      ...(sectionParagraphs.length > 0
        ? [
            {
              id: "public-signals",
              title: "Public Signals",
              summary: polishReportSentence(
                sectionParagraphs[0] ||
                  "Public details surfaced during the search.",
                subject,
              ),
              paragraphs: sectionParagraphs
                .slice(0, 3)
                .map((paragraph) => polishReportSentence(paragraph, subject))
                .filter(Boolean),
              bullets: [],
              sourceUrls: sources.slice(0, 4).map((source) => source.url),
            } satisfies SearchReportSection,
          ]
        : []),
      {
        id: "coverage-limits",
        title: "Coverage Limits",
        summary: dataRichness,
        paragraphs: [
          dataRichness,
          getSourceDrivenParagraph({
            searchType: normalizedSearchType,
            subject,
            sources,
          }),
          "This run returned partial structured output, so the brief was rebuilt around the clearest public-web evidence and the strongest repeated signals in the source set.",
        ]
          .map((paragraph) => polishReportSentence(paragraph, subject))
          .filter(Boolean),
        bullets: [],
        sourceUrls: [],
      },
    ],
    timeline: [],
    sources,
    imageLeads: sources.slice(0, 4).map((source) => ({
      sourcePageUrl: source.url,
      sourceTitle: source.title,
      caption: `Possible profile image from ${source.title}`,
      confidence: "low" as const,
    })),
    images: [buildFallbackAvatar(subject)],
    followUpQueries:
      SEARCH_PROMPT_CONFIG[normalizedSearchType].followUps(subject),
    caveats: [
      "This brief was reconstructed from malformed structured output, so some details were condensed to preserve the clearest source-backed read.",
      "Identity, ownership, and timing should be weighed by what repeats across sources rather than by any single isolated page.",
    ].map((caveat) => polishReportSentence(caveat, subject)),
  } satisfies SearchReport;
}

function normalizeSourceType(value: string | undefined | null) {
  const normalized = cleanText(value).toLowerCase();

  if (!normalized) return "source";
  if (normalized.includes("official")) return "official";
  if (normalized.includes("social")) return "social";
  if (normalized.includes("news") || normalized.includes("media"))
    return "news";
  if (normalized.includes("record") || normalized.includes("court"))
    return "record";
  if (normalized.includes("directory") || normalized.includes("broker"))
    return "directory";
  if (normalized.includes("video")) return "video";
  return normalized;
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

export function parseResponseOutputText(data: Record<string, any>) {
  const output = Array.isArray(data.output) ? data.output : [];

  return output
    .filter((item) => item?.type === "message")
    .flatMap((item) => (Array.isArray(item.content) ? item.content : []))
    .filter((item) => item?.type === "output_text")
    .map((item) => item.text)
    .filter(Boolean)
    .join("\n");
}

export function extractToolSourceUrls(data: Record<string, any>) {
  const output = Array.isArray(data.output) ? data.output : [];
  const urls: string[] = [];

  for (const item of output) {
    if (item?.type !== "web_search_call") continue;
    const sources = item?.action?.sources;
    if (!Array.isArray(sources)) continue;

    for (const source of sources) {
      const url = normalizeUrl(source?.url);
      if (url) {
        urls.push(url);
      }
    }
  }

  return Array.from(new Set(urls));
}

export function hydrateSearchReport({
  draft,
  query,
  searchType,
  subjectName,
}: {
  draft: SearchReportDraft;
  query: string;
  searchType?: string | null;
  subjectName?: string | null;
}): SearchReport {
  const normalizedSearchType = normalizeReportSearchType(searchType);
  const config = SEARCH_PROMPT_CONFIG[normalizedSearchType];
  const subject =
    cleanText(subjectName) || cleanText(draft.hero?.title) || "Search subject";

  const sources = uniqueBy(
    (Array.isArray(draft.sources) ? draft.sources : [])
      .map((source) => {
        const url = normalizeUrl(source?.url);
        if (!url) return null;

        let domain = "source";
        try {
          domain = new URL(url).hostname.replace(/^www\./, "");
        } catch {}

        return {
          title: cleanText(source?.title) || domain,
          url,
          domain,
          type: normalizeSourceType(source?.type),
          note: cleanText(source?.note) || "Relevant public source",
        } satisfies SearchReportSource;
      })
      .filter(Boolean) as SearchReportSource[],
    (source) => source.url,
  );

  const imageLeads = uniqueBy(
    (Array.isArray(draft.imageLeads) ? draft.imageLeads : [])
      .map((lead) => {
        const sourcePageUrl = normalizeUrl(lead?.sourcePageUrl);
        if (!sourcePageUrl) return null;

        return {
          sourcePageUrl,
          sourceTitle: cleanText(lead?.sourceTitle) || "Image lead",
          caption: cleanText(lead?.caption) || `Possible image for ${subject}`,
          confidence:
            lead?.confidence === "high" || lead?.confidence === "medium"
              ? lead.confidence
              : "low",
        } satisfies SearchReportImageLead;
      })
      .filter(Boolean) as SearchReportImageLead[],
    (lead) => lead.sourcePageUrl,
  );

  const quickFacts = (Array.isArray(draft.quickFacts) ? draft.quickFacts : [])
    .map((fact) => ({
      label: cleanText(fact?.label),
      value: polishReportSentence(cleanText(fact?.value), subject),
    }))
    .filter((fact) => fact.label && fact.value)
    .slice(0, 8);

  const executiveSummary = (
    Array.isArray(draft.executiveSummary) ? draft.executiveSummary : []
  )
    .map((item) => ({
      title: cleanText(item?.title),
      detail: polishReportSentence(cleanText(item?.detail), subject),
      tone: (item?.tone === "positive" || item?.tone === "caution"
        ? item.tone
        : "neutral") as ReportTone,
      sourceUrls: (Array.isArray(item?.sourceUrls) ? item.sourceUrls : [])
        .map((url) => normalizeUrl(url))
        .filter(Boolean) as string[],
    }))
    .filter((item) => item.title && item.detail)
    .slice(0, 6);

  const sections = (Array.isArray(draft.sections) ? draft.sections : [])
    .map((section, index) => ({
      id: cleanText(section?.id) || `section-${index + 1}`,
      title: cleanText(section?.title) || `Section ${index + 1}`,
      summary: polishReportSentence(cleanText(section?.summary), subject),
      paragraphs: (Array.isArray(section?.paragraphs) ? section.paragraphs : [])
        .map((paragraph) => polishReportSentence(cleanText(paragraph), subject))
        .filter(Boolean),
      bullets: (Array.isArray(section?.bullets) ? section.bullets : [])
        .map((bullet) => polishReportSentence(cleanText(bullet), subject))
        .filter(Boolean),
      sourceUrls: uniqueBy(
        (Array.isArray(section?.sourceUrls) ? section.sourceUrls : [])
          .map((url) => normalizeUrl(url))
          .filter(Boolean) as string[],
        (url) => url,
      ),
    }))
    .filter(
      (section) =>
        section.title &&
        (section.summary ||
          section.paragraphs.length ||
          section.bullets.length),
    )
    .slice(0, 8);
  const sourceDomains = getSourceDomains(sources);
  const fallbackSummary =
    polishReportSentence(cleanText(draft.hero?.summary), subject) ||
    quickFacts[0]?.value ||
    getDefaultSummaryText({
      searchType: normalizedSearchType,
      subject,
      sourceCount: sources.length,
      sourceDomains,
    });
  const fallbackSections =
    sections.length > 0
      ? sections
      : [
          {
            id: "identity-match",
            title: "Identity Match",
            summary: fallbackSummary,
            paragraphs: [
              fallbackSummary,
              cleanText(draft.hero?.matchAssessment),
            ].filter(Boolean),
            bullets: quickFacts
              .slice(0, 4)
              .map((fact) => `${fact.label}: ${fact.value}`),
            sourceUrls: sources.slice(0, 4).map((source) => source.url),
          } satisfies SearchReportSection,
          {
            id: "coverage-notes",
            title: "Coverage Notes",
            summary:
              polishCoverageLabel(cleanText(draft.hero?.dataRichness)) ||
              getDefaultCoverageLabel(
                normalizedSearchType,
                sources.length,
                sourceDomains,
              ),
            paragraphs: [
              polishCoverageLabel(cleanText(draft.hero?.dataRichness)) ||
                getDefaultCoverageLabel(
                  normalizedSearchType,
                  sources.length,
                  sourceDomains,
                ),
              getSourceDrivenParagraph({
                searchType: normalizedSearchType,
                subject,
                sources,
              }),
              "This result was reconstructed from the strongest structured fields available on this run and centered on the clearest repeated public signals.",
            ].filter(Boolean),
            bullets: [],
            sourceUrls: [],
          } satisfies SearchReportSection,
        ];

  const timeline = uniqueBy(
    (Array.isArray(draft.timeline) ? draft.timeline : [])
      .map((event) => {
        const sourceUrl = normalizeUrl(event?.sourceUrl);
        return {
          date: cleanText(event?.date),
          title: cleanText(event?.title),
          description: cleanText(event?.description),
          sourceUrl: sourceUrl ?? "",
        } satisfies SearchReportTimelineEvent;
      })
      .filter((event) => event.date && event.title && event.description),
    (event) => `${event.date}-${event.title}`,
  ).slice(0, 10);

  const followUpQueries = uniqueBy(
    (Array.isArray(draft.followUpQueries) ? draft.followUpQueries : [])
      .map((queryValue) => cleanText(queryValue))
      .filter(Boolean),
    (value) => value.toLowerCase(),
  );

  const caveats = uniqueBy(
    (Array.isArray(draft.caveats) ? draft.caveats : [])
      .map((caveat) => polishReportSentence(cleanText(caveat), subject))
      .filter(Boolean),
    (value) => value.toLowerCase(),
  ).slice(0, 6);

  return {
    searchType: normalizedSearchType,
    reportLabel: config.label,
    subject,
    rawQuery: query,
    generatedAt: new Date().toISOString(),
    hero: {
      eyebrow: cleanText(draft.hero?.eyebrow) || config.label,
      title: cleanText(draft.hero?.title) || `${config.label} for ${subject}`,
      summary: fallbackSummary,
      confidenceLabel: polishConfidenceLabel(
        cleanText(draft.hero?.confidenceLabel) || "Lead match",
      ),
      matchAssessment: polishReportSentence(
        cleanText(draft.hero?.matchAssessment) ||
          getDefaultMatchAssessmentText({
            searchType: normalizedSearchType,
            subject,
            sourceCount: sources.length,
          }),
        subject,
      ),
      dataRichness: polishCoverageLabel(
        cleanText(draft.hero?.dataRichness) ||
          getDefaultCoverageLabel(
            normalizedSearchType,
            sources.length,
            sourceDomains,
          ),
      ),
    },
    quickFacts:
      quickFacts.length > 0
        ? quickFacts
        : [
            { label: "Search Type", value: config.label },
            { label: "Sources", value: String(sources.length) },
            {
              label: "Coverage",
              value:
                polishCoverageLabel(cleanText(draft.hero?.dataRichness)) ||
                getDefaultCoverageLabel(
                  normalizedSearchType,
                  sources.length,
                  sourceDomains,
                ),
            },
          ],
    executiveSummary:
      executiveSummary.length > 0
        ? executiveSummary
        : [
            {
              title: "Summary",
              detail: fallbackSummary,
              tone: "neutral",
              sourceUrls: sources.slice(0, 3).map((source) => source.url),
            },
          ],
    sections: fallbackSections,
    timeline,
    sources,
    imageLeads,
    images: [],
    followUpQueries:
      followUpQueries.length > 0
        ? followUpQueries.slice(0, 8)
        : config.followUps(subject).slice(0, 4),
    caveats:
      caveats.length > 0
        ? caveats
        : [
            polishReportSentence(
              "This brief is anchored to the public-web record surfaced on this run, and the strongest conclusions are the ones supported by overlap across sources.",
              subject,
            ),
          ],
  };
}

function extractLinks(content: string) {
  const sources: SearchReportSource[] = [];
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(content)) !== null) {
    const url = normalizeUrl(match[2]);
    if (!url) continue;

    let domain = "source";
    try {
      domain = new URL(url).hostname.replace(/^www\./, "");
    } catch {}

    sources.push({
      title: cleanText(match[1]) || domain,
      url,
      domain,
      type: "source",
      note: "Source mentioned in the report",
    });
  }

  return uniqueBy(sources, (source) => source.url);
}

function extractImageUrls(content: string) {
  const urls = new Set<string>();
  const patterns = [
    /!\[[^\]]*\]\((https?:\/\/[^)]+)\)/g,
    /(https?:\/\/[^\s<>\]\["']+\.(?:png|jpg|jpeg|gif|webp))/gi,
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(content)) !== null) {
      const value = normalizeUrl(match[1] ?? match[0]);
      if (value) {
        urls.add(value);
      }
    }
  }

  return Array.from(urls);
}

export function buildFallbackReportFromContent({
  content,
  subjectName,
  searchType,
}: {
  content: string;
  subjectName?: string | null;
  searchType?: string | null;
}): SearchReport {
  const parsedDraft = parseStructuredReportDraft(content);
  if (parsedDraft) {
    return hydrateSearchReport({
      draft: parsedDraft,
      query: cleanText(subjectName) || "Search subject",
      searchType,
      subjectName,
    });
  }

  if (looksLikeStructuredReportContent(content)) {
    return buildSalvagedStructuredFallback({
      content,
      subjectName,
      searchType,
    });
  }

  const normalizedSearchType = normalizeReportSearchType(searchType);
  const label = getReportLabel(normalizedSearchType);
  const subject = cleanText(subjectName) || "Search subject";
  const normalizedContent = stripCodeFences(content);
  const sections = normalizedContent
    .split(/\n(?=#{1,3}\s)/)
    .map((block, index) => {
      const trimmed = block.trim();
      if (!trimmed) return null;

      const headerMatch = trimmed.match(/^#{1,3}\s*(.+)$/m);
      const title = headerMatch
        ? cleanText(headerMatch[1])
        : index === 0
          ? "Overview"
          : `Section ${index + 1}`;
      const body = trimmed.replace(/^#{1,3}\s*.+$/m, "").trim();
      const paragraphs = body
        .split(/\n\n+/)
        .map((paragraph) => polishReportSentence(cleanText(paragraph), subject))
        .filter(Boolean);

      return {
        id: `section-${index + 1}`,
        title,
        summary: polishReportSentence(paragraphs[0] ?? "", subject),
        paragraphs,
        bullets: [],
        sourceUrls: [],
      } satisfies SearchReportSection;
    })
    .filter(Boolean) as SearchReportSection[];

  const sources = extractLinks(normalizedContent);
  const images = extractImageUrls(normalizedContent)
    .slice(0, 12)
    .map((url) => ({
      url,
      sourcePageUrl: url,
      sourceTitle: "Linked image",
      caption: `Image related to ${subject}`,
      confidence: "low" as const,
    }));

  const sourceDomains = getSourceDomains(sources);
  const firstParagraph =
    sections[0]?.paragraphs[0] ||
    polishReportSentence(cleanText(normalizedContent).slice(0, 240), subject) ||
    getDefaultSummaryText({
      searchType: normalizedSearchType,
      subject,
      sourceCount: sources.length,
      sourceDomains,
    });

  return {
    searchType: normalizedSearchType,
    reportLabel: label,
    subject,
    rawQuery: subject,
    generatedAt: new Date().toISOString(),
    hero: {
      eyebrow: label,
      title: `${label} for ${subject}`,
      summary:
        firstParagraph ||
        getDefaultSummaryText({
          searchType: normalizedSearchType,
          subject,
          sourceCount: sources.length,
          sourceDomains,
        }),
      confidenceLabel: polishConfidenceLabel(
        sources.length >= 8 ? "Lead match" : "Selective lead",
      ),
      matchAssessment: polishReportSentence(
        getDefaultMatchAssessmentText({
          searchType: normalizedSearchType,
          subject,
          sourceCount: sources.length,
        }),
        subject,
      ),
      dataRichness: polishCoverageLabel(
        sources.length > 0
          ? getDefaultCoverageLabel(
              normalizedSearchType,
              sources.length,
              sourceDomains,
            )
          : getDefaultCoverageLabel(normalizedSearchType, 0, sourceDomains),
      ),
    },
    quickFacts: [
      { label: "Search Type", value: label },
      { label: "Sources", value: String(sources.length) },
      { label: "Images", value: String(images.length) },
    ],
    executiveSummary: firstParagraph
      ? [
          {
            title: "Summary",
            detail: firstParagraph,
            tone: "neutral" as const,
            sourceUrls: sources.slice(0, 3).map((source) => source.url),
          },
        ]
      : [],
    sections:
      sections.length > 0
        ? sections
        : [
            {
              id: "overview",
              title: "Overview",
              summary: polishReportSentence(
                cleanText(normalizedContent) ||
                  getSourceDrivenParagraph({
                    searchType: normalizedSearchType,
                    subject,
                    sources,
                  }),
                subject,
              ),
              paragraphs: [
                polishReportSentence(cleanText(normalizedContent), subject) ||
                  getSourceDrivenParagraph({
                    searchType: normalizedSearchType,
                    subject,
                    sources,
                  }),
              ],
              bullets: [],
              sourceUrls: [],
            },
          ],
    timeline: [],
    sources,
    imageLeads: sources.slice(0, 4).map((source) => ({
      sourcePageUrl: source.url,
      sourceTitle: source.title,
      caption: `Possible profile image from ${source.title}`,
      confidence: "low",
    })),
    images: images.length > 0 ? images : [buildFallbackAvatar(subject)],
    followUpQueries:
      SEARCH_PROMPT_CONFIG[normalizedSearchType].followUps(subject),
    caveats: [
      polishReportSentence(
        "This report was rendered from legacy text content, so some structured metadata may be missing, but the answer remains centered on the clearest public signals surfaced on this run.",
        subject,
      ),
    ],
  };
}

export function buildReportText(report: SearchReport) {
  const lines: string[] = [];

  lines.push(`${report.reportLabel}: ${report.subject}`);
  lines.push(
    `Generated: ${new Date(report.generatedAt).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })}`,
  );
  lines.push("");
  lines.push(report.hero.title);
  lines.push(report.hero.summary);
  lines.push("");

  if (report.quickFacts.length > 0) {
    lines.push("Quick Facts");
    for (const fact of report.quickFacts) {
      lines.push(`- ${fact.label}: ${fact.value}`);
    }
    lines.push("");
  }

  if (report.executiveSummary.length > 0) {
    lines.push("Executive Summary");
    for (const item of report.executiveSummary) {
      lines.push(`- ${item.title}: ${item.detail}`);
    }
    lines.push("");
  }

  for (const section of report.sections) {
    lines.push(section.title);
    if (section.summary) {
      lines.push(section.summary);
    }
    for (const paragraph of section.paragraphs) {
      lines.push(paragraph);
    }
    for (const bullet of section.bullets) {
      lines.push(`- ${bullet}`);
    }
    if (section.sourceUrls.length > 0) {
      lines.push(`Sources: ${section.sourceUrls.join(", ")}`);
    }
    lines.push("");
  }

  if (report.timeline.length > 0) {
    lines.push("Timeline");
    for (const event of report.timeline) {
      lines.push(`- ${event.date}: ${event.title} — ${event.description}`);
    }
    lines.push("");
  }

  if (report.caveats.length > 0) {
    lines.push("Caveats");
    for (const caveat of report.caveats) {
      lines.push(`- ${caveat}`);
    }
    lines.push("");
  }

  if (report.sources.length > 0) {
    lines.push("Sources");
    for (const source of report.sources) {
      lines.push(`- ${source.title}: ${source.url}`);
    }
  }

  return lines.join("\n").trim();
}

export async function requestRevealSearch(
  payload: RevealSearchRequest,
): Promise<RevealSearchResponse> {
  let responseId: string | undefined;
  let searchStage: string | undefined;

  for (let attempt = 0; attempt < 200; attempt += 1) {
    const response = await fetch(
      responseId ? "/api/perplexity/search?poll=1" : "/api/perplexity/search",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          responseId ? { ...payload, responseId, searchStage } : payload,
        ),
      },
    );

    const data = await response.json().catch(() => ({}));

    if (response.status === 202 && data?.pending && data?.responseId) {
      responseId = (data as PendingRevealSearchResponse).responseId;
      searchStage = (data as PendingRevealSearchResponse).searchStage;
      const pollAfterMs =
        (data as PendingRevealSearchResponse).pollAfterMs ?? 3000;

      await new Promise((resolve) => setTimeout(resolve, pollAfterMs));
      continue;
    }

    if (response.status === 429 && responseId) {
      const retryAfterSeconds =
        Number(data?.retryAfter) ||
        Number(response.headers.get("Retry-After")) ||
        5;

      await new Promise((resolve) =>
        setTimeout(resolve, retryAfterSeconds * 1000),
      );
      continue;
    }

    if (!response.ok) {
      const message = data?.message || data?.error || "Search failed";
      throw new Error(message);
    }

    return data as RevealSearchResponse;
  }

  throw new Error(
    "Search is still running. Please give it another minute and try again.",
  );
}

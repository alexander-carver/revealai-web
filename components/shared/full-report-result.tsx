"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  AtSign,
  Car,
  Camera,
  Check,
  Clock3,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Globe,
  Heart,
  Link2,
  Phone,
  Scale,
  Search,
  Shield,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  buildFallbackReportFromContent,
  buildReportText,
  normalizeReportSearchType,
  type ReportSearchType,
  type SearchReport,
} from "@/lib/reveal-search";

interface FullReportResultProps {
  content: string;
  report?: SearchReport | null;
  onFollowUpSearch?: (query: string) => void;
  searchCount: number;
  personName?: string;
  searchType?: string;
}

interface ReportTheme {
  accent: string;
  tint: string;
  border: string;
  badgeLabel: string;
  Icon: typeof Search;
}

interface SourcePresentation {
  label: string;
  Icon: LucideIcon;
}

const REPORT_THEMES: Record<ReportSearchType, ReportTheme> = {
  fullreport: {
    accent: "#dc2626",
    tint: "rgba(220, 38, 38, 0.10)",
    border: "rgba(220, 38, 38, 0.20)",
    badgeLabel: "Full Report",
    Icon: Search,
  },
  social: {
    accent: "#e1306c",
    tint: "rgba(225, 48, 108, 0.10)",
    border: "rgba(225, 48, 108, 0.20)",
    badgeLabel: "Dating Apps Search",
    Icon: Heart,
  },
  followers: {
    accent: "#fd5068",
    tint: "rgba(253, 80, 104, 0.10)",
    border: "rgba(253, 80, 104, 0.20)",
    badgeLabel: "Followers Search",
    Icon: Users,
  },
  phone: {
    accent: "#06b6d4",
    tint: "rgba(6, 182, 212, 0.10)",
    border: "rgba(6, 182, 212, 0.20)",
    badgeLabel: "Reverse Phone Lookup",
    Icon: Phone,
  },
  vehicle: {
    accent: "#059669",
    tint: "rgba(5, 150, 105, 0.10)",
    border: "rgba(5, 150, 105, 0.20)",
    badgeLabel: "Vehicle Lookup",
    Icon: Car,
  },
  records: {
    accent: "#f59e0b",
    tint: "rgba(245, 158, 11, 0.12)",
    border: "rgba(245, 158, 11, 0.24)",
    badgeLabel: "Records Search",
    Icon: Scale,
  },
  privacy: {
    accent: "#e11d48",
    tint: "rgba(225, 29, 72, 0.10)",
    border: "rgba(225, 29, 72, 0.20)",
    badgeLabel: "Privacy Scan",
    Icon: Shield,
  },
  username: {
    accent: "#8b5cf6",
    tint: "rgba(139, 92, 246, 0.10)",
    border: "rgba(139, 92, 246, 0.22)",
    badgeLabel: "Username Search",
    Icon: AtSign,
  },
};

const SOURCE_PRESENTATIONS: Record<string, SourcePresentation> = {
  official: {
    label: "Official",
    Icon: Shield,
  },
  social: {
    label: "Social",
    Icon: AtSign,
  },
  record: {
    label: "Records",
    Icon: Scale,
  },
  directory: {
    label: "Directory",
    Icon: FileText,
  },
  news: {
    label: "News",
    Icon: Globe,
  },
  video: {
    label: "Video",
    Icon: Link2,
  },
  image: {
    label: "Image",
    Icon: Camera,
  },
  source: {
    label: "Source",
    Icon: Globe,
  },
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildPrintableHtml(report: SearchReport) {
  const sectionsHtml = report.sections
    .map((section) => {
      const paragraphs = section.paragraphs
        .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
        .join("");
      const bullets = section.bullets.length
        ? `<ul>${section.bullets
            .map((bullet) => `<li>${escapeHtml(bullet)}</li>`)
            .join("")}</ul>`
        : "";

      return `
        <section>
          <h2>${escapeHtml(section.title)}</h2>
          ${section.summary ? `<p><strong>${escapeHtml(section.summary)}</strong></p>` : ""}
          ${paragraphs}
          ${bullets}
        </section>
      `;
    })
    .join("");

  const sourcesHtml = report.sources.length
    ? `<h2>Sources</h2><ul>${report.sources
        .map(
          (source) =>
            `<li><a href="${escapeHtml(source.url)}">${escapeHtml(
              source.title,
            )}</a> — ${escapeHtml(source.note)}</li>`,
        )
        .join("")}</ul>`
    : "";

  return `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(report.reportLabel)} - ${escapeHtml(report.subject)}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 880px; margin: 40px auto; padding: 0 24px; color: #0f172a; line-height: 1.65; }
        h1 { font-size: 32px; margin-bottom: 8px; }
        h2 { font-size: 18px; margin-top: 28px; margin-bottom: 10px; }
        p { margin: 0 0 12px; }
        ul { margin: 0 0 16px 20px; }
        .meta { color: #475569; font-size: 14px; margin-bottom: 18px; }
        .hero { border: 1px solid #e2e8f0; border-radius: 18px; padding: 20px; background: #f8fafc; }
      </style>
    </head>
    <body>
      <div class="hero">
        <h1>${escapeHtml(report.subject)}</h1>
        <div class="meta">${escapeHtml(report.reportLabel)} • Generated ${escapeHtml(
          new Date(report.generatedAt).toLocaleString("en-US", {
            dateStyle: "long",
            timeStyle: "short",
          }),
        )}</div>
        <p>${escapeHtml(report.hero.summary)}</p>
      </div>
      ${sectionsHtml}
      ${sourcesHtml}
    </body>
  </html>`;
}

function getTheme(searchType?: string | null) {
  const normalized = normalizeReportSearchType(searchType);
  return REPORT_THEMES[normalized];
}

function sourceLabel(url: string, fallback?: string) {
  try {
    return fallback || new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return fallback || "Source";
  }
}

function isFallbackImage(image?: SearchReport["images"][number] | null) {
  if (!image) return true;

  return (
    image.sourceTitle === "Generated fallback avatar" ||
    image.url.includes("ui-avatars.com/api/")
  );
}

function getSubjectInitials(subject: string) {
  const parts = subject
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) return "RA";
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function formatSourceType(type: string) {
  switch (type) {
    case "official":
      return "Official";
    case "social":
      return "Social";
    case "record":
      return "Records";
    case "directory":
      return "Directory";
    case "news":
      return "News";
    case "video":
      return "Video";
    case "image":
      return "Image";
    default:
      return "Source";
  }
}

function getSourcePresentation(type: string) {
  const normalized = type.toLowerCase();

  if (normalized === "records") {
    return SOURCE_PRESENTATIONS.record;
  }

  if (normalized === "sources") {
    return SOURCE_PRESENTATIONS.source;
  }

  return SOURCE_PRESENTATIONS[normalized] ?? SOURCE_PRESENTATIONS.source;
}

function normalizeCompareText(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function dedupeStrings(items: string[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = normalizeCompareText(item);
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function FullReportResult({
  content,
  report,
  onFollowUpSearch,
  searchCount: _searchCount,
  personName,
  searchType,
}: FullReportResultProps) {
  const structuredReport = useMemo(
    () =>
      report ??
      buildFallbackReportFromContent({
        content,
        subjectName: personName,
        searchType,
      }),
    [content, personName, report, searchType],
  );

  const theme = getTheme(structuredReport.searchType);
  const ThemeIcon = theme.Icon;
  const [showAllSources, setShowAllSources] = useState(false);
  const [showAllImages, setShowAllImages] = useState(false);
  const [followUpQuery, setFollowUpQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [matchFeedback, setMatchFeedback] = useState<"yes" | "no" | null>(null);

  const heroSummaryKey = normalizeCompareText(structuredReport.hero.summary);
  const realImages = structuredReport.images.filter(
    (image) => !isFallbackImage(image),
  );
  const visibleImages = showAllImages ? realImages : realImages.slice(0, 6);
  const visibleQuickFacts = structuredReport.quickFacts
    .filter(
      (fact) =>
        fact.label &&
        fact.value &&
        !(
          structuredReport.quickFacts.length <= 3 &&
          ["Search Type", "Sources", "Images"].includes(fact.label)
        ),
    )
    .slice(0, 6);
  const visibleTakeaways = structuredReport.executiveSummary
    .filter((item) => normalizeCompareText(item.detail) !== heroSummaryKey)
    .slice(0, 4);
  const displaySections = structuredReport.sections
    .map((section) => ({
      ...section,
      paragraphs: dedupeStrings(section.paragraphs),
      bullets: dedupeStrings(section.bullets),
    }))
    .filter(
      (section) =>
        section.summary ||
        section.paragraphs.some((paragraph) => paragraph.trim().length > 0) ||
        section.bullets.length > 0,
    )
    .filter((section, index, sections) => {
      const firstLine = normalizeCompareText(
        section.paragraphs[0] || section.summary || "",
      );

      if (
        section.title.toLowerCase() === "summary" &&
        firstLine === heroSummaryKey &&
        sections.length > 1
      ) {
        return false;
      }

      return true;
    });
  const sourceTypeCounts = Array.from(
    structuredReport.sources.reduce((accumulator, source) => {
      const key = formatSourceType(source.type);
      accumulator.set(key, (accumulator.get(key) ?? 0) + 1);
      return accumulator;
    }, new Map<string, number>()),
  )
    .sort((left, right) => right[1] - left[1])
    .slice(0, 6);
  const displaySources = showAllSources
    ? structuredReport.sources
    : structuredReport.sources.slice(0, 6);
  const generatedAtLabel = new Date(
    structuredReport.generatedAt,
  ).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const heroStats = [
    {
      label: "Sources",
      value: String(structuredReport.sources.length),
      detail: structuredReport.sources.length
        ? "linked references captured"
        : "source trail still forming",
    },
    {
      label: "Match Read",
      value: structuredReport.hero.confidenceLabel,
      detail: structuredReport.hero.dataRichness,
    },
    {
      label: "Images",
      value: String(realImages.length),
      detail: realImages.length
        ? "public images attributed"
        : "source trail concentrates outside photography",
    },
    {
      label: "Sections",
      value: String(displaySections.length),
      detail: displaySections.length
        ? "major report areas filled"
        : "brief still forming from source text",
    },
  ];
  const answerParagraphs = dedupeStrings([
    structuredReport.hero.summary,
    structuredReport.hero.matchAssessment,
    ...visibleTakeaways.map((item) => item.detail),
    ...displaySections.flatMap((section) => [
      section.summary,
      ...section.paragraphs,
      ...section.bullets,
    ]),
    ...(displaySections.length < 4 ? structuredReport.caveats : []),
  ])
    .filter(Boolean)
    .slice(0, structuredReport.searchType === "fullreport" ? 14 : 10);
  const detailSections = displaySections.slice(0, 6);
  const visibleTimeline = structuredReport.timeline.slice(0, 6);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(buildReportText(structuredReport));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleSavePdf = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(buildPrintableHtml(structuredReport));
    printWindow.document.close();
    printWindow.print();
  };

  const handleFollowUpSubmit = () => {
    if (!followUpQuery.trim() || !onFollowUpSearch) return;
    onFollowUpSearch(followUpQuery.trim());
    setFollowUpQuery("");
  };

  return (
    <div className="relative isolate mx-auto max-w-4xl space-y-5">
      <div
        className="pointer-events-none absolute inset-x-4 top-0 -z-10 h-32 rounded-[999px] blur-3xl"
        style={{
          background: `radial-gradient(circle at top, ${theme.tint} 0%, rgba(255,255,255,0) 72%)`,
        }}
      />
      <section className="overflow-hidden rounded-[30px] border border-black/5 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
        <div
          className="h-20 w-full"
          style={{
            background: `linear-gradient(180deg, ${theme.tint} 0%, rgba(255,255,255,0) 100%)`,
          }}
        />
        <div className="-mt-10 space-y-5 px-4 pb-5 sm:px-6 sm:pb-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="gap-2 rounded-full border-black/10 bg-white text-slate-700"
            >
              <ThemeIcon className="h-3.5 w-3.5" />
              {theme.badgeLabel}
            </Badge>
            <Badge
              variant="outline"
              className="rounded-full border-black/10 bg-[#f5f5f5] text-slate-700"
            >
              {structuredReport.hero.confidenceLabel}
            </Badge>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#f5f5f5] px-3 py-1 text-xs text-slate-500">
              <Clock3 className="h-3.5 w-3.5" />
              {generatedAtLabel}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">
              {structuredReport.hero.eyebrow}
            </p>
            <h2 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
              {structuredReport.subject}
            </h2>
            <p className="max-w-3xl text-base leading-8 text-slate-600">
              {structuredReport.hero.summary}
            </p>
          </div>

          <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
            {visibleImages.length > 0 ? (
              visibleImages.map((image) => (
                <a
                  key={image.url}
                  href={image.sourcePageUrl || image.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative h-40 w-32 flex-shrink-0 overflow-hidden rounded-[24px] bg-[#f4f4f4] sm:h-48 sm:w-40"
                >
                  <Image
                    src={image.url}
                    alt={image.caption}
                    fill
                    unoptimized
                    className="object-cover transition duration-300 group-hover:scale-[1.03]"
                    sizes="(max-width: 640px) 128px, 160px"
                  />
                </a>
              ))
            ) : (
              <div className="flex h-40 w-32 flex-shrink-0 items-center justify-center rounded-[24px] bg-[#f4f4f4] text-3xl font-semibold text-slate-500 sm:h-48 sm:w-40">
                {getSubjectInitials(structuredReport.subject)}
              </div>
            )}
          </div>

          {realImages.length > 6 && (
            <Button
              variant="outline"
              className="rounded-full border-black/10 bg-[#f5f5f5] text-slate-700 hover:bg-[#efefef]"
              onClick={() => setShowAllImages((value) => !value)}
            >
              {showAllImages
                ? "Show fewer images"
                : `Show ${realImages.length - 6} more images`}
            </Button>
          )}

          <div className="rounded-[26px] bg-[#f3f3f3] p-4 sm:p-5">
            <p className="text-lg font-semibold tracking-[-0.02em] text-slate-900">
              Is this the person you were looking for?
            </p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              {structuredReport.hero.matchAssessment}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMatchFeedback("yes")}
                className={`rounded-full px-4 py-3 text-sm font-semibold transition ${
                  matchFeedback === "yes"
                    ? "bg-slate-950 text-white"
                    : "bg-white text-slate-700"
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setMatchFeedback("no")}
                className={`rounded-full px-4 py-3 text-sm font-semibold transition ${
                  matchFeedback === "no"
                    ? "bg-slate-950 text-white"
                    : "bg-white text-slate-700"
                }`}
              >
                No
              </button>
            </div>
            {matchFeedback === "yes" && (
              <p className="mt-3 text-sm text-slate-500">
                This brief stays centered on the strongest public match from
                this run.
              </p>
            )}
            {matchFeedback === "no" && (
              <p className="mt-3 text-sm text-slate-500">
                Use the sources and related prompts below to refine the match.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {heroStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-[22px] bg-[#f5f5f5] px-4 py-4"
              >
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                  {stat.label}
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {stat.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {structuredReport.sources.length > 0 && (
        <section className="rounded-[30px] border border-black/5 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center gap-2 text-xl font-semibold tracking-[-0.02em] text-slate-900">
            <Link2 className="h-5 w-5" />
            Sources
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {displaySources.map((source) => {
              const sourcePresentation = getSourcePresentation(source.type);
              const SourceIcon = sourcePresentation.Icon;

              return (
                <a
                  key={source.url}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[124px] rounded-[22px] bg-[#f5f5f5] p-4 transition hover:bg-[#efefef]"
                >
                  <div className="flex items-center gap-2 text-slate-500">
                    <SourceIcon className="h-4 w-4" />
                    <span className="truncate text-sm font-medium">
                      {sourcePresentation.label}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm font-semibold text-slate-900">
                    {source.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">{source.domain}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {source.note}
                  </p>
                </a>
              );
            })}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {sourceTypeCounts.map(([label, count]) => (
              <div
                key={label}
                className="rounded-full bg-[#f5f5f5] px-3 py-1.5 text-xs font-medium text-slate-600"
              >
                {label} · {count}
              </div>
            ))}
          </div>

          {structuredReport.sources.length > 6 && (
            <button
              type="button"
              onClick={() => setShowAllSources((value) => !value)}
              className="mt-3 w-full rounded-[20px] bg-[#f1f1f1] px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-[#ebebeb]"
            >
              {showAllSources
                ? "Show fewer sources"
                : `+${structuredReport.sources.length - 6} more sources`}
            </button>
          )}
        </section>
      )}

      <section className="rounded-[30px] border border-black/5 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-center gap-2 text-xl font-semibold tracking-[-0.02em] text-slate-900">
          <Search className="h-5 w-5" />
          Answer
        </div>
        <div className="mt-4 space-y-4">
          {answerParagraphs.map((paragraph, index) => (
            <p
              key={`${paragraph}-${index}`}
              className="text-base leading-8 text-slate-700"
            >
              {paragraph}
            </p>
          ))}
        </div>
        <div className="mt-5 flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f5f5f5] text-slate-600 transition hover:bg-[#ececec]"
            aria-label="Copy report"
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            onClick={handleSavePdf}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f5f5f5] text-slate-600 transition hover:bg-[#ececec]"
            aria-label="Save PDF"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </section>

      {(visibleTakeaways.length > 0 || visibleQuickFacts.length > 0) && (
        <section className="rounded-[30px] border border-black/5 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center gap-2 text-xl font-semibold tracking-[-0.02em] text-slate-900">
            <Sparkles className="h-5 w-5" />
            Snapshot
          </div>
          {visibleTakeaways.length > 0 && (
            <div className="mt-4 space-y-3">
              {visibleTakeaways.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[22px] bg-[#f5f5f5] p-4"
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          )}
          {visibleQuickFacts.length > 0 && (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {visibleQuickFacts.map((fact) => (
                <div
                  key={`${fact.label}-${fact.value}`}
                  className="rounded-[22px] bg-[#f5f5f5] px-4 py-4"
                >
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                    {fact.label}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {fact.value}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {detailSections.length > 0 && (
        <section className="rounded-[30px] border border-black/5 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center gap-2 text-xl font-semibold tracking-[-0.02em] text-slate-900">
            <FileText className="h-5 w-5" />
            Detailed findings
          </div>
          <div className="mt-4 space-y-4">
            {detailSections.map((section) => (
              <article
                key={section.id}
                className="rounded-[24px] bg-[#f5f5f5] p-4 sm:p-5"
              >
                <h3 className="text-lg font-semibold tracking-[-0.02em] text-slate-900">
                  {section.title}
                </h3>
                {section.summary && (
                  <p className="mt-2 text-sm leading-7 text-slate-500">
                    {section.summary}
                  </p>
                )}

                <div className="mt-3 space-y-3">
                  {section.paragraphs.map((paragraph, paragraphIndex) => (
                    <p
                      key={`${section.id}-${paragraphIndex}`}
                      className="text-sm leading-7 text-slate-700"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>

                {section.bullets.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {section.bullets.map((bullet, bulletIndex) => (
                      <div
                        key={`${section.id}-bullet-${bulletIndex}`}
                        className="rounded-[18px] bg-white px-4 py-3 text-sm leading-7 text-slate-600"
                      >
                        {bullet}
                      </div>
                    ))}
                  </div>
                )}

                {section.sourceUrls.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {section.sourceUrls.slice(0, 4).map((url) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-600"
                      >
                        {sourceLabel(url)}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {visibleTimeline.length > 0 && (
        <section className="rounded-[30px] border border-black/5 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center gap-2 text-xl font-semibold tracking-[-0.02em] text-slate-900">
            <Clock3 className="h-5 w-5" />
            Timeline
          </div>
          <div className="mt-4 space-y-3">
            {visibleTimeline.map((event) => (
              <div
                key={`${event.date}-${event.title}`}
                className="rounded-[22px] bg-[#f5f5f5] p-4"
              >
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                  {event.date}
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {event.title}
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  {event.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {(structuredReport.followUpQueries.length > 0 || onFollowUpSearch) && (
        <section className="rounded-[30px] border border-black/5 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center gap-2 text-xl font-semibold tracking-[-0.02em] text-slate-900">
            <Search className="h-5 w-5" />
            Related
          </div>
          <div className="mt-4 divide-y divide-black/6">
            {structuredReport.followUpQueries.slice(0, 6).map((query) => (
              <button
                key={query}
                type="button"
                onClick={() => onFollowUpSearch?.(query)}
                disabled={!onFollowUpSearch}
                className="flex w-full items-center justify-between gap-3 py-4 text-left text-base font-medium text-slate-800 transition hover:text-slate-950 disabled:cursor-default disabled:opacity-80"
              >
                <span>{query}</span>
                <span className="text-xl text-slate-400">→</span>
              </button>
            ))}
          </div>

          {onFollowUpSearch && (
            <div className="mt-5 flex gap-2">
              <Input
                value={followUpQuery}
                onChange={(event) => setFollowUpQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleFollowUpSubmit();
                  }
                }}
                placeholder="Ask a follow-up"
                className="h-12 rounded-full border-none bg-[#f3f3f3] px-4 text-sm shadow-none focus-visible:ring-1 focus-visible:ring-slate-300"
              />
              <Button
                type="button"
                onClick={handleFollowUpSubmit}
                className="h-12 w-12 rounded-full bg-[#f3f3f3] p-0 text-slate-700 hover:bg-[#ebebeb]"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

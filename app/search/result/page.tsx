"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchLoadingScreen } from "@/components/shared/search-loading-screen";
import { FullReportResult } from "@/components/shared/full-report-result";
import { useSubscription } from "@/hooks/use-subscription";
import { useAuth } from "@/hooks/use-auth";
import { lookupMockProfileByDetails } from "@/lib/mock-data";
import { getSearchProductBySearchType } from "@/lib/search-products";
import {
  buildFallbackReportFromContent,
  normalizeReportSearchType,
  requestRevealSearch,
  type SearchReport,
} from "@/lib/reveal-search";
import {
  buildSearchIntakePromptContext,
  getSearchIntakeAnswersFromParams,
  getSearchIntakeStorageKey,
  hasSearchIntakeAnswers,
  normalizeSearchIntakeAnswers,
  SEARCH_INTAKE_TOKEN_PARAM,
  type SearchIntakeAnswers,
} from "@/lib/search-intake";

function formatPhoneDisplay(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits[0] === "1") {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

const SEARCH_INTAKE_MAX_AGE_MS = 2 * 60 * 60 * 1000;

function readStoredSearchIntakeAnswers(
  token: string | null | undefined,
): SearchIntakeAnswers {
  if (typeof window === "undefined") return {};

  const storageKey = getSearchIntakeStorageKey(token);
  if (!storageKey) return {};

  try {
    const rawValue = window.sessionStorage.getItem(storageKey);
    if (!rawValue) return {};

    const parsedValue = JSON.parse(rawValue) as {
      answers?: unknown;
      savedAt?: unknown;
    };
    const savedAt =
      typeof parsedValue.savedAt === "number" ? parsedValue.savedAt : 0;

    if (!savedAt || Date.now() - savedAt > SEARCH_INTAKE_MAX_AGE_MS) {
      window.sessionStorage.removeItem(storageKey);
      return {};
    }

    return normalizeSearchIntakeAnswers(parsedValue.answers);
  } catch {
    return {};
  }
}

function buildSearchQuery({
  fullName,
  location,
  searchType,
  username,
  phoneNumber,
  vin,
  plate,
  intakeContext,
}: {
  fullName: string;
  location: string;
  searchType: string;
  username?: string;
  phoneNumber?: string;
  vin?: string;
  plate?: string;
  intakeContext?: string;
}) {
  const withIntakeContext = (baseQuery: string) =>
    intakeContext ? `${baseQuery}\n\n${intakeContext}` : baseQuery;

  if (searchType === "followers") {
    return withIntakeContext(location
      ? `Analyze the public social media footprint for ${fullName} from ${location} with a focus on follower red flags. Look for public Instagram, TikTok, X, Facebook, and other social accounts tied to this person. Identify, when publicly visible, one-sided follows, people who do not follow them back, suspicious burner or bait-style account clusters, and any audience or following signals that feel inconsistent with the profile story.`
      : `Analyze the public social media footprint for ${fullName} with a focus on follower red flags. Look for public Instagram, TikTok, X, Facebook, and other social accounts tied to this person. Identify, when publicly visible, one-sided follows, people who do not follow them back, suspicious burner or bait-style account clusters, and any audience or following signals that feel inconsistent with the profile story.`);
  }

  if (searchType === "social") {
    return withIntakeContext(location
      ? `Search across all major social platforms, dating apps, public profiles, and open-web mentions for ${fullName} from ${location}. Highlight the strongest social accounts, dating-platform clues, usernames, tagged photos, public comments, replies, mentions, likes or engagement traces, and anything that helps with a dating-safety or identity-verification check. Look for public activity such as "commented on", "replied to", tagged interactions, forum posts, and other visible engagement signals tied to this person.`
      : `Search across all major social platforms, dating apps, public profiles, and open-web mentions for ${fullName}. Highlight the strongest social accounts, dating-platform clues, usernames, tagged photos, public comments, replies, mentions, likes or engagement traces, and anything that helps with a dating-safety or identity-verification check. Look for public activity such as "commented on", "replied to", tagged interactions, forum posts, and other visible engagement signals tied to this person.`);
  }

  if (searchType === "username" && username) {
    return withIntakeContext(`Search for the username "${username}" across all major social media platforms, forums, dating apps, and websites. Find the strongest direct profile matches, then look deeper for public comments, replies, mentions, tagged posts, forum activity, GitHub or Reddit activity, Facebook comment traces, YouTube comments, TikTok/X replies, and any other visible interaction trail tied to this handle. Explain which matches are strongest, what links the accounts together, and what public identity signals or red flags stand out.`);
  }

  if (searchType === "phone" && phoneNumber) {
    return withIntakeContext(`Run a reverse phone lookup for ${phoneNumber}. Start with who most likely owns or uses this number now, then explain what the number is tied to: person, household, business, carrier, line type, geography, directory footprint, spam or scam complaints, public listings, and any public social or web traces linked to it. If no direct owner is fully corroborated, state the strongest current association and the evidence behind it.`);
  }

  if (searchType === "vehicle") {
    if (vin) {
      return withIntakeContext(`Run a vehicle lookup for VIN ${vin}. Start with exactly what vehicle this VIN resolves to now, then explain the strongest identifier-backed details: year, make, model, trim, body style, engine, manufacturer, plant details, recall or safety context, and any marketplace or resale signals that help verify this vehicle.`);
    }

    if (plate) {
      return withIntakeContext(`Run a vehicle lookup starting from license plate ${plate}. Start with what this plate is most strongly tied to now, then explain any public vehicle-identification clues, listing traces, jurisdiction hints, marketplace signals, and supporting open-web evidence linked to the plate. Make clear what the plate does establish and what remains open.`);
    }
  }

  return withIntakeContext(location
    ? `Build a full public-web report for ${fullName} from ${location}. Start with the best-supported identity match, then cover biography, work history, education, affiliations, locations, public records, social profiles, media coverage, related people, organizations, timeline details, and anything else meaningfully tied to this person. Make the answer detailed, source-backed, and substantive.`
    : `Build a full public-web report for ${fullName}. Start with the best-supported identity match, then cover biography, work history, education, affiliations, locations, public records, social profiles, media coverage, related people, organizations, timeline details, and anything else meaningfully tied to this person. Make the answer detailed, source-backed, and substantive.`);
}

function buildMockResult({
  fullName,
  searchType,
  mockProfile,
}: {
  fullName: string;
  searchType: string;
  mockProfile: {
    answer: string;
    images: string[];
    sources: Array<{ label: string; url: string }>;
  };
}) {
  const report = buildFallbackReportFromContent({
    content: mockProfile.answer,
    subjectName: fullName,
    searchType,
  });

  report.images = mockProfile.images.map((url) => ({
    url,
    sourcePageUrl: url,
    sourceTitle: "Mock profile image",
    caption: `Image associated with ${fullName}`,
    confidence: "medium" as const,
  }));

  report.sources = mockProfile.sources.map((source) => ({
    title: source.label,
    url: source.url,
    domain: (() => {
      try {
        return new URL(source.url).hostname.replace(/^www\./, "");
      } catch {
        return "source";
      }
    })(),
    type: "source",
    note: "Mock profile source",
  }));

  return {
    content: mockProfile.answer,
    report,
  };
}

function SearchResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isPro, showFreeTrialPaywall, isFreeTrialPaywallVisible } =
    useSubscription();
  const { user } = useAuth();

  const [showLoadingScreen, setShowLoadingScreen] = useState(true);
  const [searchResult, setSearchResult] = useState<{
    content: string;
    report: SearchReport;
  } | null>(null);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isMockResult, setIsMockResult] = useState(false);

  const firstName = searchParams.get("firstName") || "";
  const lastName = searchParams.get("lastName") || "";
  const city = searchParams.get("city") || "";
  const state = searchParams.get("state") || "";
  const username = (searchParams.get("username") || "")
    .trim()
    .replace(/^@+/, "");
  const phoneNumber = searchParams.get("number") || searchParams.get("phone") || "";
  const vin = searchParams.get("vin") || "";
  const plate = searchParams.get("plate") || "";
  const searchType = normalizeReportSearchType(
    searchParams.get("type") ?? searchParams.get("searchType"),
  );
  const intakeToken = searchParams.get(SEARCH_INTAKE_TOKEN_PARAM);
  const [storedIntakeAnswers, setStoredIntakeAnswers] =
    useState<SearchIntakeAnswers>(() =>
      readStoredSearchIntakeAnswers(intakeToken),
    );
  const urlIntakeAnswers = useMemo(
    () => getSearchIntakeAnswersFromParams(searchParams),
    [searchParams],
  );
  const intakeAnswers = useMemo(
    () =>
      hasSearchIntakeAnswers(urlIntakeAnswers)
        ? urlIntakeAnswers
        : storedIntakeAnswers,
    [storedIntakeAnswers, urlIntakeAnswers],
  );
  const intakeContext = useMemo(
    () => buildSearchIntakePromptContext(intakeAnswers),
    [intakeAnswers],
  );

  const fullName = `${firstName} ${lastName}`.trim();
  const location = [city, state].filter(Boolean).join(", ");
  const loadingProductId = getSearchProductBySearchType(searchType);
  const subjectLabel =
    searchType === "username"
      ? username
        ? `@${username}`
        : ""
      : searchType === "phone"
        ? formatPhoneDisplay(phoneNumber)
        : searchType === "vehicle"
          ? vin || plate
          : fullName;
  const supportsMockProfile =
    searchType === "fullreport" ||
    searchType === "social" ||
    searchType === "followers";
  const hasRequiredInput =
    searchType === "username"
      ? username.length >= 2
      : searchType === "phone"
        ? phoneNumber.replace(/\D/g, "").length >= 10
        : searchType === "vehicle"
          ? Boolean(vin || plate)
          : Boolean(firstName && lastName);

  const mockProfile = useMemo(
    () => lookupMockProfileByDetails(firstName, lastName, city, state),
    [city, firstName, lastName, state],
  );

  useEffect(() => {
    setStoredIntakeAnswers(readStoredSearchIntakeAnswers(intakeToken));
  }, [intakeToken]);

  useEffect(() => {
    setIsMockResult(Boolean(mockProfile) && supportsMockProfile);

    if (mockProfile && supportsMockProfile) {
      return;
    }

    if (!isPro) {
      router.push("/");
    }
  }, [isPro, mockProfile, router, supportsMockProfile]);

  const performSearch = async (overrideQuery?: string) => {
    if (!hasRequiredInput) {
      router.push("/");
      return;
    }

    setHasError(false);
    setErrorMessage(null);

    if (mockProfile && supportsMockProfile) {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setSearchResult(
        buildMockResult({
          fullName: subjectLabel,
          searchType,
          mockProfile,
        }),
      );
      setShowLoadingScreen(false);
      return;
    }

    if (!isPro) {
      router.push("/");
      return;
    }

    const query =
      overrideQuery ||
      buildSearchQuery({
        fullName,
        location,
        searchType,
        username,
        phoneNumber: formatPhoneDisplay(phoneNumber),
        vin,
        plate,
        intakeContext,
      });

    try {
      const result = await requestRevealSearch({
        query,
        userId: user?.id ?? "guest",
        usePro: true,
        isPro: true,
        searchType,
        subjectName: subjectLabel,
        location:
          searchType === "fullreport" ||
          searchType === "social" ||
          searchType === "followers" ||
          searchType === "records"
            ? location
            : undefined,
      });

      setSearchResult({
        content: result.content,
        report: result.report,
      });
    } catch (error: any) {
      console.warn("Search request did not complete:", error);
      setHasError(true);
      setSearchResult(null);
      setErrorMessage(
        error?.message ||
          "Unable to complete this search right now. Please try again.",
      );
    } finally {
      setIsRetrying(false);
      setShowLoadingScreen(false);
    }
  };

  useEffect(() => {
    performSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstName, lastName, city, state, username, phoneNumber, vin, plate, searchType, intakeContext]);

  const handleRetry = () => {
    setIsRetrying(true);
    setShowLoadingScreen(true);
    setSearchResult(null);
    performSearch();
  };

  const handleFollowUpSearch = async (query: string) => {
    if (!isPro) {
      showFreeTrialPaywall();
      return;
    }

    setShowLoadingScreen(true);
    setSearchResult(null);
    await performSearch(
      `Regarding ${subjectLabel}${
        location &&
        (searchType === "fullreport" ||
          searchType === "social" ||
          searchType === "followers" ||
          searchType === "records")
          ? ` from ${location}`
          : ""
      }: ${query}`,
    );
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${subjectLabel} - RevealAI`,
          url: window.location.href,
        });
        return;
      } catch {
        // fall through to clipboard
      }
    }

    await navigator.clipboard.writeText(window.location.href);
  };

  if (showLoadingScreen) {
    return (
      <SearchLoadingScreen
        isVisible
        searchQuery={subjectLabel}
        productId={loadingProductId}
        showLongSearchNote={isPro}
        onComplete={() => setShowLoadingScreen(false)}
        onCancel={() => {
          setShowLoadingScreen(false);
          router.push("/");
        }}
      />
    );
  }

  if (!isPro && !isMockResult && (isFreeTrialPaywallVisible || !searchResult)) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!searchResult) {
    if (errorMessage) {
      const isDelayMessage = /too many requests|still running|try again/i.test(
        errorMessage,
      );

      return (
        <div className="min-h-screen bg-background">
          <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
            <div className="container mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/")}
              >
                <ArrowLeft className="mr-2 w-4 h-4" />
                Back
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={isRetrying}
                onClick={handleRetry}
              >
                {isRetrying ? "Retrying..." : "Try Again"}
              </Button>
            </div>
          </header>

          <main className="container mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center justify-center px-4 py-10">
            <div className="w-full rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-sm">
              <h1 className="text-2xl font-semibold text-slate-900">
                {isDelayMessage
                  ? "Search Taking Longer Than Usual"
                  : "Search Unavailable"}
              </h1>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {errorMessage}
              </p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <Button onClick={handleRetry} disabled={isRetrying}>
                  {isRetrying ? "Retrying..." : "Try Again"}
                </Button>
                <Button variant="outline" onClick={() => router.push("/")}>
                  Back Home
                </Button>
              </div>
            </div>
          </main>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleShare}>
              <Share2 className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={isRetrying}
              onClick={handleRetry}
            >
              {isRetrying ? "Retrying..." : "Try Again"}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-6 sm:py-8">
        <FullReportResult
          content={searchResult.content}
          report={searchResult.report}
          onFollowUpSearch={handleFollowUpSearch}
          searchCount={0}
          personName={subjectLabel}
          searchType={searchType}
        />

        {hasError && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Some live search coverage was limited on this run, so this result
            may be thinner than usual.
          </div>
        )}

        <div className="mt-6 rounded-[24px] bg-[#f3efe8] p-4">
          <p className="text-sm leading-7 text-slate-600">
            This report is compiled from publicly available information for
            informational purposes only. It is not intended for employment,
            tenant screening, credit, or other FCRA-regulated decisions.
          </p>
        </div>
      </main>
    </div>
  );
}

export default function SearchResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      }
    >
      <SearchResultContent />
    </Suspense>
  );
}

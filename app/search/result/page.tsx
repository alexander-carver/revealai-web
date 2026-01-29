"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef, Suspense } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Globe,
  Share2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Search,
  Lock,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useSubscription } from "@/hooks/use-subscription";
import { useAuth } from "@/hooks/use-auth";
import { SearchLoadingScreen } from "@/components/shared/search-loading-screen";
import { lookupMockProfileByDetails, emmaSmithProfile } from "@/lib/mock-data";
import { Logo } from "@/components/shared/logo";

// Parse Perplexity response to extract structured data
function parsePerplexityResponse(content: string, personName: string) {
  const images: string[] = [];
  const sources: Array<{ label: string; url: string }> = [];

  // Extract Perplexity's proxied images (st.perplexity.ai/estatic/)
  const perplexityImageRegex = /(https?:\/\/st\.perplexity\.ai\/estatic\/[^\s<>\[\]"'\)]+)/gi;
  let match;
  while ((match = perplexityImageRegex.exec(content)) !== null) {
    if (match[1] && !images.includes(match[1])) {
      images.push(match[1]);
    }
  }

  // Extract image URLs from markdown image syntax ![alt](url)
  const markdownImageRegex = /!\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g;
  while ((match = markdownImageRegex.exec(content)) !== null) {
    if (match[2] && !images.includes(match[2])) {
      images.push(match[2]);
    }
  }

  // Also try to find standalone image URLs with common extensions
  const imageExtRegex = /(https?:\/\/[^\s<>\[\]"'\)]+\.(?:jpg|jpeg|png|gif|webp|svg))/gi;
  while ((match = imageExtRegex.exec(content)) !== null) {
    if (match[1] && !images.includes(match[1])) {
      images.push(match[1]);
    }
  }

  // Extract source links from markdown [label](url)
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
  while ((match = linkRegex.exec(content)) !== null) {
    // Skip if it's an image link (preceded by !)
    const beforeMatch = content.substring(Math.max(0, match.index - 1), match.index);
    if (beforeMatch !== "!") {
      const url = match[2];
      const label = match[1];
      // Don't add duplicate URLs and don't add image URLs as sources
      if (!sources.some(s => s.url === url) && !url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
        sources.push({ label, url });
      }
    }
  }

  // Look for any URLs in the text and add as sources
  const anyUrlRegex = /https?:\/\/[^\s<>\[\]"'\)]+/g;
  while ((match = anyUrlRegex.exec(content)) !== null) {
    const url = match[0].replace(/[.,;:!?]$/, ''); // Clean trailing punctuation
    if (!sources.some(s => s.url === url) && 
        !images.includes(url) &&
        !url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) && 
        !url.includes('st.perplexity.ai')) {
      try {
        const domain = new URL(url).hostname.replace('www.', '');
        sources.push({ label: domain, url });
      } catch {
        // Invalid URL, skip
      }
    }
  }

  return { images, sources, answer: content };
}

// Format answer text - clean up markdown and format nicely
function formatAnswer(text: string): string {
  // First, remove image markdown and image URLs
  let cleaned = text
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '') // Remove ![alt](url)
    .replace(/https?:\/\/st\.perplexity\.ai\/estatic\/[^\s<>\[\]"'\)]+/gi, '') // Remove Perplexity image URLs
    .replace(/https?:\/\/[^\s<>\[\]"'\)]+\.(?:jpg|jpeg|png|gif|webp|svg)/gi, '') // Remove other image URLs
    
  // Convert markdown to clean HTML
  let html = cleaned
    // Convert **bold** to <strong>
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-foreground">$1</strong>')
    // Remove # headers but keep the text as bold headings
    .replace(/^#{1,3}\s*(.+)$/gm, '<h3 class="text-lg font-semibold text-foreground mt-5 mb-2">$1</h3>')
    // Convert bullet points (- or •)
    .replace(/^[-•]\s*(.+)$/gm, '<li class="ml-4 mb-1">$1</li>')
    // Convert numbered lists
    .replace(/^\d+\.\s*(.+)$/gm, '<li class="ml-4 mb-1 list-decimal">$1</li>')
    // Convert markdown links to HTML links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>')
    // Clean up citation numbers like [1], [2] etc
    .replace(/\[(\d+)\]/g, '<sup class="text-xs text-primary">[$1]</sup>')
    // Remove empty lines and normalize spacing
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Wrap in paragraphs
  const paragraphs = html.split('\n\n').filter(p => p.trim());
  html = paragraphs.map(p => {
    const trimmed = p.trim();
    // Don't wrap if it's already an h3 or list item
    if (trimmed.startsWith('<h3') || trimmed.startsWith('<li')) {
      return trimmed;
    }
    // Wrap lists in ul
    if (trimmed.includes('<li')) {
      return `<ul class="list-disc mb-4">${trimmed}</ul>`;
    }
    return `<p class="mb-4 leading-relaxed">${trimmed.replace(/\n/g, '<br/>')}</p>`;
  }).join('');

  return html;
}

function SearchResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isPro, showFreeTrialPaywall, isFreeTrialPaywallVisible } = useSubscription();
  const { user } = useAuth();

  const [showLoadingScreen, setShowLoadingScreen] = useState(true);
  const [result, setResult] = useState<string | null>(null);
  const [apiImages, setApiImages] = useState<string[]>([]);
  const [apiCitations, setApiCitations] = useState<string[]>([]);
  const [parsedData, setParsedData] = useState<{
    images: string[];
    sources: Array<{ label: string; url: string }>;
    answer: string;
  } | null>(null);
  const [hasError, setHasError] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showOpenEndedSearch, setShowOpenEndedSearch] = useState(false);
  const [openEndedQuery, setOpenEndedQuery] = useState("");
  const [isSearchingOpenEnded, setIsSearchingOpenEnded] = useState(false);

  // Check if this is a mock profile (like Emma Smith) - allow non-pro users to view mock profiles
  const [isMockResult, setIsMockResult] = useState(false);
  
  // Redirect non-Pro users back to home UNLESS they're viewing a mock profile
  useEffect(() => {
    const searchFirstName = searchParams.get("firstName") || "";
    const searchLastName = searchParams.get("lastName") || "";
    const searchCity = searchParams.get("city") || "";
    const searchState = searchParams.get("state") || "";
    
    const mockProfile = lookupMockProfileByDetails(searchFirstName, searchLastName, searchCity, searchState);
    if (mockProfile) {
      setIsMockResult(true);
      return; // Allow viewing mock profiles without pro
    }
    
    if (!isPro) {
      router.push("/");
    }
  }, [isPro, router, searchParams]);

  const [imageError, setImageError] = useState<Record<string, boolean>>({});
  const [showMoreSources, setShowMoreSources] = useState(false);
  const [followUpQuery, setFollowUpQuery] = useState("");
  const galleryRef = useRef<HTMLDivElement>(null);

  // Get search params
  const firstName = searchParams.get("firstName") || "";
  const lastName = searchParams.get("lastName") || "";
  const city = searchParams.get("city") || "";
  const state = searchParams.get("state") || "";
  const searchType = searchParams.get("type") || "fullreport";

  const fullName = `${firstName} ${lastName}`.trim();
  const location = [city, state].filter(Boolean).join(", ");

  // Follow-up questions based on person name
  const followUpSuggestions = [
    `What professional experience does ${fullName} have?`,
    `What investments or business ventures is ${fullName} involved in?`,
    `What education background does ${fullName} have?`,
    `What controversies or legal issues involve ${fullName}?`,
    `What social media presence does ${fullName} have?`,
  ];

  // Search function - can be called on mount or retry
  const performSearch = async () => {
    if (!firstName || !lastName) {
      router.push("/");
      return;
    }

    // Reset error state and start loading screen
    setHasError(false);
    const searchStartTime = Date.now();
    const MIN_LOADING_TIME_MS = 8000; // 8 seconds minimum

    // Check for mock profile first - available to everyone (pro or not)
    const mockProfile = lookupMockProfileByDetails(firstName, lastName, city, state);
    if (mockProfile) {
      setIsMockResult(true);
      
      // Simulate loading time for better UX
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setParsedData({
        images: mockProfile.images,
        sources: mockProfile.sources,
        answer: mockProfile.answer,
      });
      setShowLoadingScreen(false);
      return;
    }

    // Non-Pro users should never reach here for non-mock searches
    if (!isPro) {
      router.push("/");
      return;
    }
    
    // Build query based on search type
    let query;
    if (searchType === "datingapps") {
      query = location
        ? `Tell me everything about ${fullName} from ${location}, who are they dating, do they have any relationships with anyone else`
        : `Tell me everything about ${fullName}, who are they dating, do they have any relationships with anyone else`;
    } else {
      query = location
        ? `Tell me everything about ${fullName} from ${location}`
        : `Tell me everything about ${fullName}`;
    }

    try {
      const response = await fetch("/api/perplexity/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          userId: user?.id || "guest",
          usePro: true,
          isPro: isPro || false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle rate limit error specifically
        if (response.status === 429) {
          throw new Error(errorData.message || "Rate limit exceeded. Please try again later.");
        }
        
        throw new Error(errorData.error || "Search failed");
      }

      const data = await response.json();
      console.log("=== PERPLEXITY API RESPONSE ===");
      console.log("Full response:", data);
      console.log("Images from API:", data.images);
      console.log("Citations from API:", data.citations);
      console.log("Debug info:", data._debug);
      
      setResult(data.content);
      
      // Extract image URLs from API response
      // Images come as objects with image_url property
      const apiImageUrls: string[] = (data.images || []).map((img: any) => {
        if (typeof img === 'string') return img;
        if (img.image_url) return img.image_url;
        return null;
      }).filter(Boolean);
      
      console.log("Extracted image URLs:", apiImageUrls);
      
      // Store API-provided images and citations
      if (apiImageUrls.length > 0) {
        setApiImages(apiImageUrls);
      }
      if (data.citations && data.citations.length > 0) {
        setApiCitations(data.citations);
      }
      
      // Parse the content and merge with API data
      const parsed = parsePerplexityResponse(data.content, fullName);
      
      // Merge API images with parsed images (API images first - they're better quality)
      const allImages = [...apiImageUrls, ...parsed.images];
      const uniqueImages = Array.from(new Set(allImages));
      
      // Convert citations to sources format
      const citationSources = (data.citations || []).map((url: string) => {
        try {
          const domain = new URL(url).hostname.replace('www.', '');
          return { label: domain, url };
        } catch {
          return { label: url, url };
        }
      });
      
      // Merge with parsed sources
      const allSources = [...citationSources, ...parsed.sources];
      const uniqueSources = allSources.filter((source, index, self) => 
        index === self.findIndex(s => s.url === source.url)
      );
      
      setParsedData({
        images: uniqueImages.length > 0 ? uniqueImages : [`https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&size=600&background=6366f1&color=fff&bold=true`],
        sources: uniqueSources,
        answer: parsed.answer,
      });
      
      // Hide loading screen after data is successfully parsed
      setShowLoadingScreen(false);
      } catch (error: any) {
        console.error("Search error:", error);
        setHasError(true);
        
        // Check if it's a rate limit error
        const isRateLimit = error?.message?.includes("Rate limit") || error?.message?.includes("daily limit");
        
        // Still set some default data so page renders
        setParsedData({
          images: [`https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&size=600&background=6366f1&color=fff&bold=true`],
          sources: [],
          answer: isRateLimit 
            ? error.message || "You've reached your daily search limit. Please try again tomorrow or upgrade to Pro for more searches."
            : "Unable to find information. Please try again.",
        });
        
        // Hide loading screen even on error so error message can be shown
        setShowLoadingScreen(false);
    } finally {
      setIsRetrying(false);
    }
  };

  // Retry handler
  const handleRetry = () => {
    setIsRetrying(true);
    setShowLoadingScreen(true);
    setParsedData(null);
    performSearch();
  };

  // Perform search on mount
  useEffect(() => {
    performSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstName, lastName, city, state, searchType]);

  const handleImageError = (imageSrc: string) => {
    setImageError((prev) => ({ ...prev, [imageSrc]: true }));
  };


  // Handle loading screen completion
  const handleLoadingComplete = () => {
    setShowLoadingScreen(false);
  };

  // Handle loading screen cancel
  const handleLoadingCancel = () => {
    setShowLoadingScreen(false);
    router.push("/");
  };

  // Handle locked source/follow-up click
  const handleLockedClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isPro) {
      showFreeTrialPaywall();
    }
  };

  // Handle Full Background Check button - open open-ended search
  const handleFullBackgroundCheck = () => {
    if (!isPro) {
      showFreeTrialPaywall();
      return;
    }
    setShowOpenEndedSearch(true);
  };

  // Handle open-ended search submission
  const handleOpenEndedSearch = async () => {
    if (!openEndedQuery.trim() || !isPro) return;

    setIsSearchingOpenEnded(true);
    setShowLoadingScreen(true);

    try {
      const response = await fetch("/api/perplexity/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: openEndedQuery,
          userId: user?.id || "guest",
          usePro: true,
          isPro: isPro || false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 403) {
          showFreeTrialPaywall();
          setIsSearchingOpenEnded(false);
          setShowLoadingScreen(false);
          return;
        }
        
        if (response.status === 429) {
          throw new Error(errorData.message || "Rate limit exceeded. Please try again later.");
        }
        
        throw new Error(errorData.error || "Search failed");
      }

      const data = await response.json();
      
      // Navigate to results page with the new query
      const params = new URLSearchParams({
        firstName: openEndedQuery,
        lastName: "",
        city: "",
        state: "",
        searchType: "fullreport",
      });
      
      router.push(`/search/result?${params.toString()}`);
    } catch (error: any) {
      console.error("Open-ended search error:", error);
      setIsSearchingOpenEnded(false);
      setShowLoadingScreen(false);
      alert(error.message || "Search failed. Please try again.");
    }
  };

  // Handle follow-up search
  const handleFollowUpSearch = (query: string) => {
    if (!isPro) {
      showFreeTrialPaywall();
      return;
    }
    showFreeTrialPaywall();
  };

  const handleFollowUpSubmit = () => {
    if (!followUpQuery.trim()) return;
    handleFollowUpSearch(followUpQuery);
  };

  // Get working images (filter out errored ones)
  const getDisplayImages = () => {
    if (!parsedData) return [];
    const working = parsedData.images.filter(img => !imageError[img]);
    if (working.length === 0) {
      return [`https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&size=600&background=6366f1&color=fff&bold=true`];
    }
    return working;
  };

  const displayImages = getDisplayImages();

  // Show loading screen overlay
  if (showLoadingScreen) {
    return (
      <SearchLoadingScreen
        isVisible={true}
        searchQuery={fullName}
        onComplete={handleLoadingComplete}
        onCancel={handleLoadingCancel}
      />
    );
  }

  // For non-Pro users waiting for paywall or with paywall visible, show nothing
  if (!isPro && (isFreeTrialPaywallVisible || !parsedData)) {
    return (
      <div className="min-h-screen bg-background">
        {/* Empty page - paywall will overlay */}
      </div>
    );
  }

  // No results state - only show for Pro users who actually got no results
  // Non-Pro users should never see this - they stay on loading screen until paywall redirects
  if (!parsedData) {
    // If not Pro, keep showing loading screen
    if (!isPro) {
      return (
        <>
          <SearchLoadingScreen
            isVisible={true}
            searchQuery={fullName}
            onComplete={() => {}}
            onCancel={() => router.push("/")}
          />
        </>
      );
    }
    
    // Pro users who got no results
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">No Results Found</h1>
          <p className="text-muted-foreground mb-4">
            We couldn&apos;t find information for {fullName}
          </p>
          <Button onClick={() => router.push("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="w-3 h-3 text-green-500" />
              Verified Profile
            </Badge>
            <Button variant="ghost" size="icon">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Name and Location */}
        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-2">
            <div className="flex-1">
              <h1 className="text-4xl font-bold">{fullName}</h1>
              {location && (
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline" className="text-sm">
                    {location}
                  </Badge>
                </div>
              )}
            </div>
            {/* Reveal AI Branding - Only show for Emma Smith mock profile */}
            {isMockResult && fullName.toLowerCase().includes("emma smith") && (
              <div className="flex items-center gap-2">
                <Logo size="sm" showText={true} className="flex-shrink-0" />
              </div>
            )}
          </div>
        </div>

        {/* Image Gallery - Full Width */}
        <div className="relative mb-8">
          <Card className="overflow-hidden">
            <div className="relative">
              {/* Navigation Arrows - Desktop Only */}
              {displayImages.length > 1 && (
                <>
                  <button
                    onClick={() => {
                      if (galleryRef.current) {
                        galleryRef.current.scrollBy({ left: -300, behavior: 'smooth' });
                      }
                    }}
                    className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors shadow-lg"
                    aria-label="Previous images"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      if (galleryRef.current) {
                        galleryRef.current.scrollBy({ left: 300, behavior: 'smooth' });
                      }
                    }}
                    className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors shadow-lg"
                    aria-label="Next images"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
              
              {/* Horizontal Image Gallery */}
              <div 
                ref={galleryRef}
                className="flex gap-3 p-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
              >
                {displayImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative w-40 h-52 sm:w-48 sm:h-64 md:w-56 md:h-72 flex-shrink-0 rounded-lg overflow-hidden bg-muted snap-center"
                  >
                    <Image
                      src={
                        imageError[img]
                          ? `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&size=600&background=6366f1&color=fff&bold=true`
                          : img
                      }
                      alt={`${fullName} - Photo ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 160px, (max-width: 768px) 192px, 224px"
                      onError={() => handleImageError(img)}
                      unoptimized
                    />
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Profile Info Section */}
        <div className="space-y-6 mb-8">
          <div>
            <p className="text-xl text-muted-foreground">
              {(() => {
                // Get first sentence and clean it up
                const firstSentence = parsedData.answer
                  .replace(/!\[[^\]]*\]\([^)]+\)/g, '') // Remove image markdown
                  .replace(/\*\*/g, '') // Remove bold markers
                  .replace(/#{1,3}\s*/g, '') // Remove header markers
                  .replace(/\[[^\]]+\]\([^)]+\)/g, (m) => m.match(/\[([^\]]+)\]/)?.[1] || '') // Keep link text only
                  .split(/[.!?]/)[0]?.trim();
                return firstSentence ? `${firstSentence}.` : `Profile for ${fullName}`;
              })()}
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4 text-center">
              <div className="text-3xl font-bold text-primary">
                {parsedData.sources.length}
              </div>
              <div className="text-sm text-muted-foreground">Sources</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-3xl font-bold text-primary">
                {displayImages.length}
              </div>
              <div className="text-sm text-muted-foreground">Images</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-3xl font-bold text-green-500">✓</div>
              <div className="text-sm text-muted-foreground">Verified</div>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button className="gap-2" onClick={handleFullBackgroundCheck}>
              <Search className="w-4 h-4" />
              Full Background Check
            </Button>
            <Button variant="outline" className="gap-2">
              <Share2 className="w-4 h-4" />
              Share Profile
            </Button>
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={handleRetry}
              disabled={isRetrying}
            >
              {isRetrying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Try Again
            </Button>
          </div>

          {/* Open-Ended Search Input */}
          {showOpenEndedSearch && (
            <Card className="mt-6">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Ask anything about {fullName}
                    </label>
                    <Input
                      placeholder="e.g., What is their criminal record? Where do they work? What's their net worth?"
                      value={openEndedQuery}
                      onChange={(e) => setOpenEndedQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleOpenEndedSearch();
                        }
                      }}
                      className="w-full"
                      disabled={isSearchingOpenEnded}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleOpenEndedSearch}
                      disabled={!openEndedQuery.trim() || isSearchingOpenEnded}
                      className="gap-2"
                    >
                      {isSearchingOpenEnded ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4" />
                          Search
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowOpenEndedSearch(false);
                        setOpenEndedQuery("");
                      }}
                      disabled={isSearchingOpenEnded}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sources Section */}
        {parsedData.sources.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                Sources ({parsedData.sources.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {/* Show first 4 sources */}
                {parsedData.sources.slice(0, 4).map((source, idx) => {
                  const isLocked = !isPro && idx >= 2;
                  if (isLocked) {
                    return (
                      <div
                        key={idx}
                        onClick={handleLockedClick}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border transition-all cursor-pointer opacity-70 hover:opacity-90 group"
                      >
                        <div className="p-2 rounded-lg bg-muted/50 transition-colors relative w-10 h-10 flex items-center justify-center flex-shrink-0">
                          {(source as any).image ? (
                            <Image
                              src={(source as any).image}
                              alt={source.label}
                              width={40}
                              height={40}
                              className="rounded object-cover opacity-50"
                            />
                          ) : (
                            <Globe className="w-4 h-4 text-muted-foreground" />
                          )}
                          <div className="absolute -top-1 -right-1 p-0.5 bg-blue-500 rounded-full">
                            <Lock className="w-3 h-3 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate transition-colors">
                            Source
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            Hidden
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-xs flex-shrink-0 bg-blue-50 text-blue-600 border-blue-200"
                        >
                          Pro
                        </Badge>
                      </div>
                    );
                  }
                  return (
                    <a
                      key={idx}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-all group"
                    >
                      <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors relative w-10 h-10 flex items-center justify-center flex-shrink-0">
                        {(source as any).image ? (
                          <Image
                            src={(source as any).image}
                            alt={source.label}
                            width={40}
                            height={40}
                            className="rounded object-cover"
                          />
                        ) : (
                          <Globe className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                          {source.label}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {source.url.replace(/^https?:\/\//, "").split("/")[0]}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-xs flex-shrink-0 bg-blue-50 text-blue-600 border-blue-200"
                      >
                        Source
                      </Badge>
                    </a>
                  );
                })}
              </div>

              {/* Dropdown for additional sources */}
              {parsedData.sources.length > 4 && (
                <div className="relative">
                  <div
                    onClick={
                      !isPro
                        ? handleLockedClick
                        : () => setShowMoreSources(!showMoreSources)
                    }
                    className={`w-full flex items-center justify-between p-3 rounded-lg border border-border transition-colors cursor-pointer ${
                      !isPro ? "opacity-70 hover:opacity-90" : "hover:bg-muted/50"
                    }`}
                  >
                    <span className="text-sm font-medium">
                      +{parsedData.sources.length - 4} More sources
                    </span>
                    <div className="flex items-center gap-2">
                      {!isPro && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-blue-50 text-blue-600 border-blue-200 flex items-center gap-1"
                        >
                          <Lock className="w-3 h-3" />
                          Pro
                        </Badge>
                      )}
                      {isPro && (
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${showMoreSources ? "rotate-180" : ""}`}
                        />
                      )}
                    </div>
                  </div>
                  {showMoreSources && isPro && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                      {parsedData.sources.slice(4).map((source, idx) => (
                        <a
                          key={idx + 4}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-all group"
                        >
                          <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors relative w-10 h-10 flex items-center justify-center flex-shrink-0">
                            {(source as any).image ? (
                              <Image
                                src={(source as any).image}
                                alt={source.label}
                                width={40}
                                height={40}
                                className="rounded object-cover"
                              />
                            ) : (
                              <Globe className="w-4 h-4 text-primary" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                              {source.label}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {source.url.replace(/^https?:\/\//, "").split("/")[0]}
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className="text-xs flex-shrink-0 bg-blue-50 text-blue-600 border-blue-200"
                          >
                            Source
                          </Badge>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Detailed Answer */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Detailed Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed"
              dangerouslySetInnerHTML={{ __html: formatAnswer(parsedData.answer) }}
            />
          </CardContent>
        </Card>

        {/* Related Questions Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" />
              Related
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Recommended Follow-up Questions */}
            <div className="space-y-3">
              {followUpSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleFollowUpSearch(suggestion)}
                  className="w-full flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group text-left"
                >
                  <span className="text-sm font-medium">{suggestion}</span>
                  <div className="flex items-center gap-2">
                    {!isPro && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-blue-50 text-blue-600 border-blue-200 flex items-center gap-1"
                      >
                        <Lock className="w-3 h-3" />
                        Pro
                      </Badge>
                    )}
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary flex-shrink-0" />
                  </div>
                </button>
              ))}
            </div>

            {/* Open-ended Search Input */}
            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 mb-3">
                <Search className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Ask follow up</span>
                {!isPro && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-blue-50 text-blue-600 border-blue-200 flex items-center gap-1"
                  >
                    <Lock className="w-3 h-3" />
                    Pro
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Ask anything about this person..."
                  value={followUpQuery}
                  onChange={(e) => setFollowUpQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleFollowUpSubmit()}
                  className="flex-1"
                />
                <Button
                  onClick={handleFollowUpSubmit}
                  size="icon"
                  className="bg-red-600 hover:bg-red-700"
                >
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <div className="mt-8 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-600 dark:text-amber-400 mb-1">
                Important Notice
              </h4>
              <p className="text-sm text-muted-foreground">
                This profile is compiled from publicly available sources for
                informational purposes only. It is not intended for employment,
                tenant screening, or credit decisions. Always verify information
                through official channels before making important decisions.
              </p>
            </div>
          </div>
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

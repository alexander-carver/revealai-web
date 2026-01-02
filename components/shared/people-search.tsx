"use client";

import { useState, useCallback, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Search,
  User,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  ChevronRight,
  Calendar,
  Home,
  Users,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchLoadingScreen } from "./search-loading-screen";
import {
  searchPersonCandidates,
  lookupContactMatches,
  runAIProfileSearch,
} from "@/lib/services/people-search";
import type {
  SearchQuery,
  SearchMode,
  PersonSearchCandidate,
  EnformionContactMatch,
} from "@/lib/types";
import Link from "next/link";
import { useSubscription } from "@/hooks/use-subscription";
import Image from "next/image";
import { MostSearched } from "./most-searched";

// Convert markdown links to clickable HTML links
function formatAIResponse(text: string): string {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let html = text.replace(linkRegex, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>');
  html = html.replace(/\n/g, "<br/>");
  return html;
}

export function PeopleSearch() {
  const { isPro } = useSubscription();
  const [searchMode, setSearchMode] = useState<SearchMode>("name");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zip: "",
  });

  // Mobile sticky CTA visibility
  const [showMobileCTA, setShowMobileCTA] = useState(true);

  // AI Search state (Dating App Finder)
  const [aiQuery, setAiQuery] = useState("");
  const [aiResult, setAiResult] = useState<string | null>(null);

  // Results state
  const [candidates, setCandidates] = useState<PersonSearchCandidate[]>([]);
  const [contactMatches, setContactMatches] = useState<EnformionContactMatch[]>([]);

  // Loading screen state
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [loadingSearchQuery, setLoadingSearchQuery] = useState("");

  // NOTE: Free trial paywall trigger removed - results paywall is now handled by search-loading-screen

  // Hide mobile CTA when search section is in view
  useEffect(() => {
    const searchSection = document.getElementById("search");
    if (!searchSection) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowMobileCTA(!entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(searchSection);
    return () => observer.disconnect();
  }, []);

  // Mutations
  const personSearchMutation = useMutation({
    mutationFn: async (query: SearchQuery) => {
      return searchPersonCandidates(query);
    },
    onSuccess: (data) => {
      setCandidates(data);
      setContactMatches([]);
    },
  });

  const contactSearchMutation = useMutation({
    mutationFn: async (query: SearchQuery) => {
      return lookupContactMatches(query);
    },
    onSuccess: (data) => {
      setContactMatches(data);
      setCandidates([]);
    },
  });

  const aiSearchMutation = useMutation({
    mutationFn: async (query: string) => {
      return runAIProfileSearch(query);
    },
    onSuccess: (data) => {
      setAiResult(data);
    },
  });

  // Get display name for the loading screen
  const getSearchDisplayName = useCallback(() => {
    if (searchMode === "name" || searchMode === "cheater") {
      const name = `${formData.firstName} ${formData.lastName}`.trim();
      if (name) return name;
      if (aiQuery) return aiQuery.split(" ").slice(0, 3).join(" ");
    }
    if (searchMode === "phone") return formData.phone || "Phone Number";
    if (searchMode === "email") return formData.email || "Email Address";
    if (searchMode === "address") {
      const addr = [formData.street, formData.city, formData.state].filter(Boolean).join(", ");
      return addr || "Address";
    }
    return "Unknown";
  }, [searchMode, formData, aiQuery]);

  const handleSearch = useCallback(() => {
    const query: SearchQuery = {
      mode: searchMode,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
      email: formData.email,
      street: formData.street,
      city: formData.city,
      state: formData.state,
      zip: formData.zip,
    };

    if (searchMode === "name") {
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        return;
      }
      setLoadingSearchQuery(getSearchDisplayName());
      setShowLoadingScreen(true);
      // Only run the actual search if user is pro
      if (isPro) {
        personSearchMutation.mutate(query);
      }
    } else if (searchMode !== "cheater") {
      setLoadingSearchQuery(getSearchDisplayName());
      setShowLoadingScreen(true);
      // Only run the actual search if user is pro
      if (isPro) {
        contactSearchMutation.mutate(query);
      }
    }
  }, [searchMode, formData, getSearchDisplayName, personSearchMutation, contactSearchMutation, isPro]);

  const handleAISearch = useCallback(() => {
    if (!aiQuery.trim()) return;
    
    const displayQuery = aiQuery.split(" ").slice(0, 4).join(" ");
    setLoadingSearchQuery(displayQuery);
    setShowLoadingScreen(true);
    // Only run the actual search if user is pro
    if (isPro) {
      aiSearchMutation.mutate(aiQuery);
    }
  }, [aiQuery, aiSearchMutation, isPro]);

  const handleLoadingComplete = useCallback(() => {
    setShowLoadingScreen(false);
  }, []);

  const handleLoadingCancel = useCallback(() => {
    setShowLoadingScreen(false);
    setCandidates([]);
    setContactMatches([]);
    setAiResult(null);
  }, []);

  const isLoading =
    personSearchMutation.isPending ||
    contactSearchMutation.isPending ||
    aiSearchMutation.isPending;

  const error =
    personSearchMutation.error ||
    contactSearchMutation.error ||
    aiSearchMutation.error;

  const showInlineLoading = isLoading && !showLoadingScreen;

  // Smooth scroll to search section with header offset
  const scrollToSearch = () => {
    const searchSection = document.getElementById("search");
    if (searchSection) {
      const headerHeight = 64; // Fixed header height (h-16 = 64px)
      const elementPosition = searchSection.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerHeight - 16; // 16px extra padding
      
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <>
      {/* ========================================
          HERO SECTION
          ======================================== */}
      <section className="relative min-h-[85vh] md:min-h-[80vh] flex items-center overflow-hidden">
        {/* Background Images */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Mobile Background */}
          <div className="md:hidden absolute inset-0">
            <Image
              src="/Reveal_Background_Mobile.png"
              alt=""
              fill
              className="object-cover object-top"
              priority
              unoptimized
            />
            {/* Gradient overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-white/40" />
          </div>
          {/* Desktop Background */}
          <div className="hidden md:block absolute inset-0">
            <Image
              src="/Reveal_Background_Web.png"
              alt=""
              fill
              className="object-cover object-center"
              priority
              unoptimized
            />
            {/* Gradient overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-white/50" />
          </div>
        </div>

        {/* Hero Content */}
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-xl md:max-w-2xl mx-auto md:mx-0 text-center md:text-left py-8 md:py-0">
            {/* Brand Line */}
            <p className="text-sm md:text-base font-medium text-gray-600 tracking-wide mb-3 md:mb-4">
              Reveal AI — People Search
            </p>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-red-600 leading-tight mb-3 md:mb-4">
              Find Everything, about Anyone
            </h1>

            {/* Subline */}
            <p className="text-lg md:text-xl text-gray-700 font-medium mb-8 md:mb-10">
              People Search • Dating Apps • Records
            </p>

            {/* CTA Button */}
            <button
              onClick={scrollToSearch}
              className="inline-flex items-center gap-2 px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold text-lg rounded-full shadow-lg shadow-red-600/30 hover:shadow-xl hover:shadow-red-600/40 transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <Search className="w-5 h-5" />
              Search Them
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* ========================================
          SEARCH SECTION
          ======================================== */}
      <section id="search" className="py-12 md:py-16 bg-gray-50 scroll-mt-20">
        <div className="container mx-auto px-4">
          {/* Loading Screen Overlay */}
          <SearchLoadingScreen
            isVisible={showLoadingScreen}
            searchQuery={loadingSearchQuery}
            onComplete={handleLoadingComplete}
            onCancel={handleLoadingCancel}
          />

          <Card className="border-0 shadow-2xl bg-white">
            <CardHeader className="pb-4 md:pb-6">
              <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 border border-red-100 text-sm text-red-600 font-medium">
                  <Sparkles className="w-4 h-4" />
                  <span>AI-Powered Search</span>
                </div>
                <CardTitle className="text-2xl md:text-3xl font-bold text-gray-900">
                  Start Your Search
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={searchMode} onValueChange={(v) => setSearchMode(v as SearchMode)}>
                <TabsList className="w-full grid grid-cols-5 mb-6 h-auto p-1 bg-gray-100">
                  <TabsTrigger value="cheater" className="gap-1 md:gap-2 text-xs md:text-sm py-2.5 data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm">
                    <AlertTriangle className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="hidden sm:inline">Dating Apps</span>
                    <span className="sm:hidden">Apps</span>
                  </TabsTrigger>
                  <TabsTrigger value="name" className="gap-1 md:gap-2 text-xs md:text-sm py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    <User className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="hidden sm:inline">Name</span>
                  </TabsTrigger>
                  <TabsTrigger value="phone" className="gap-1 md:gap-2 text-xs md:text-sm py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    <Phone className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="hidden sm:inline">Phone</span>
                  </TabsTrigger>
                  <TabsTrigger value="email" className="gap-1 md:gap-2 text-xs md:text-sm py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    <Mail className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="hidden sm:inline">Email</span>
                  </TabsTrigger>
                  <TabsTrigger value="address" className="gap-1 md:gap-2 text-xs md:text-sm py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    <MapPin className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="hidden sm:inline">Address</span>
                  </TabsTrigger>
                </TabsList>

                {/* Dating App Finder (AI Search) */}
                <TabsContent value="cheater" className="space-y-4">
                  <div className="bg-gradient-to-br from-red-50 to-red-100/50 border border-red-200 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      <h3 className="font-semibold text-lg text-gray-900">Find Dating Apps and Profiles</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      Use AI to find dating apps and profiles. Perfect for discovering hidden accounts, verifying identities, and comprehensive background checks.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                      placeholder="'Find everything about John Smith from Austin, TX' or 'Tell me about Sarah Johnson who lives in Miami'"
                      value={aiQuery}
                      onChange={(e) => setAiQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAISearch()}
                      className="flex-1"
                      icon={<Sparkles className="w-4 h-4" />}
                    />
                    <Button
                      onClick={handleAISearch}
                      isLoading={aiSearchMutation.isPending && !showLoadingScreen}
                      size="lg"
                      className="gap-2 bg-red-600 hover:bg-red-700 text-white shadow-lg"
                    >
                      <Search className="w-5 h-5" />
                      <span>Search</span>
                    </Button>
                  </div>

                  {aiResult && !showLoadingScreen && (
                    <div className="mt-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <div dangerouslySetInnerHTML={{ __html: formatAIResponse(aiResult) }} />
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Name Search */}
                <TabsContent value="name">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      placeholder="First Name *"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, firstName: e.target.value }))
                      }
                      icon={<User className="w-4 h-4" />}
                    />
                    <Input
                      placeholder="Last Name *"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, lastName: e.target.value }))
                      }
                      icon={<User className="w-4 h-4" />}
                    />
                    <Input
                      placeholder="City (optional)"
                      value={formData.city}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, city: e.target.value }))
                      }
                      icon={<MapPin className="w-4 h-4" />}
                    />
                    <Input
                      placeholder="State (optional)"
                      value={formData.state}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, state: e.target.value }))
                      }
                      icon={<MapPin className="w-4 h-4" />}
                    />
                  </div>
                  {/* AI Quick Search Button */}
                  {formData.firstName && formData.lastName && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 gap-2 text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => {
                        const name = `${formData.firstName} ${formData.lastName}`;
                        const location = [formData.city, formData.state].filter(Boolean).join(", ");
                        const query = location 
                          ? `Tell me everything about ${name} from ${location}`
                          : `Tell me everything about ${name}`;
                        setAiQuery(query);
                        setSearchMode("cheater");
                        handleAISearch();
                      }}
                    >
                      <Sparkles className="w-4 h-4" />
                      AI Search: &quot;Tell me everything about {formData.firstName} {formData.lastName}&quot;
                    </Button>
                  )}
                </TabsContent>

                {/* Phone Search */}
                <TabsContent value="phone">
                  <Input
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    icon={<Phone className="w-4 h-4" />}
                    type="tel"
                  />
                </TabsContent>

                {/* Email Search */}
                <TabsContent value="email">
                  <Input
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, email: e.target.value }))
                    }
                    icon={<Mail className="w-4 h-4" />}
                    type="email"
                  />
                </TabsContent>

                {/* Address Search */}
                <TabsContent value="address">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Input
                        placeholder="Street Address"
                        value={formData.street}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, street: e.target.value }))
                        }
                        icon={<Home className="w-4 h-4" />}
                      />
                    </div>
                    <Input
                      placeholder="City"
                      value={formData.city}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, city: e.target.value }))
                      }
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        placeholder="State"
                        value={formData.state}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, state: e.target.value }))
                        }
                      />
                      <Input
                        placeholder="ZIP"
                        value={formData.zip}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, zip: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Search Button (for non-AI searches) */}
              {searchMode !== "cheater" && (
                <Button
                  onClick={handleSearch}
                  isLoading={showInlineLoading && !aiSearchMutation.isPending}
                  size="lg"
                  className="w-full mt-6 gap-2 bg-red-600 hover:bg-red-700 text-white shadow-lg"
                >
                  <Search className="w-5 h-5" />
                  Search Records
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}

              {/* Error Message */}
              {error && !showLoadingScreen && (
                <Alert variant="destructive" className="mt-6">
                  {(() => {
                    const err = error as any;
                    if (err?.message) {
                      const msg = err.message;
                      if (msg.includes("{") && msg.includes("}")) {
                        try {
                          const parsed = JSON.parse(msg);
                          return parsed.message || parsed.error || "Search failed. Please try again.";
                        } catch {
                          return "Search failed. Please try again.";
                        }
                      }
                      return msg;
                    }
                    return "An error occurred during the search. Please try again.";
                  })()}
                </Alert>
              )}

              {/* Loading State */}
              {showInlineLoading && !aiSearchMutation.isPending && searchMode !== "cheater" && (
                <div className="mt-6 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="p-4">
                      <div className="flex items-center gap-4">
                        <Skeleton className="w-12 h-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-5 w-48" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Person Candidates Results */}
              {candidates.length > 0 && !showLoadingScreen && (
                <div className="mt-6">
                  <h2 className="text-lg font-semibold mb-4">
                    Found {candidates.length} result{candidates.length !== 1 ? "s" : ""}
                  </h2>
                  <div className="space-y-3">
                    {candidates.map((candidate) => (
                      <Link
                        key={candidate.id}
                        href={`/search/${candidate.id}?firstName=${encodeURIComponent(
                          candidate.firstName
                        )}&lastName=${encodeURIComponent(candidate.lastName)}`}
                      >
                        <Card className="p-4 hover:border-red-300 transition-all cursor-pointer group">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                              <User className="w-6 h-6 text-red-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold truncate">
                                  {candidate.firstName} {candidate.lastName}
                                </h3>
                                {candidate.age && (
                                  <Badge variant="secondary">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {candidate.age}
                                  </Badge>
                                )}
                              </div>
                              {(candidate.city || candidate.state) && (
                                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                  <MapPin className="w-3 h-3" />
                                  {[candidate.city, candidate.state].filter(Boolean).join(", ")}
                                </p>
                              )}
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-red-600 transition-colors" />
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Matches Results */}
              {contactMatches.length > 0 && !showLoadingScreen && (
                <div className="mt-6">
                  <h2 className="text-lg font-semibold mb-4">
                    Found {contactMatches.length} result{contactMatches.length !== 1 ? "s" : ""}
                  </h2>
                  <div className="space-y-3">
                    {contactMatches.map((match) => (
                      <Card key={match.id} className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                            <Users className="w-6 h-6 text-red-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{match.fullName || "Unknown"}</h3>
                            {match.address && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                <MapPin className="w-3 h-3" />
                                {[
                                  match.address.street,
                                  match.address.city,
                                  match.address.state,
                                ]
                                  .filter(Boolean)
                                  .join(", ")}
                              </p>
                            )}
                          </div>
                          {match.enformionId && (
                            <Link href={`/search/${match.enformionId}`}>
                              <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50">
                                View Profile
                              </Button>
                            </Link>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* No Results Message */}
              {!isLoading &&
                !showLoadingScreen &&
                candidates.length === 0 &&
                contactMatches.length === 0 &&
                (personSearchMutation.isSuccess || contactSearchMutation.isSuccess) && (
                  <Alert variant="info" className="mt-6">
                    No results found. Try adjusting your search criteria.
                  </Alert>
                )}
            </CardContent>
          </Card>

          {/* Most Searched Section */}
          <MostSearched />
        </div>
      </section>

      {/* ========================================
          MOBILE STICKY CTA
          ======================================== */}
      <div
        className={`md:hidden fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-lg transition-transform duration-300 ${
          showMobileCTA ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <button
          onClick={scrollToSearch}
          className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold text-base rounded-full shadow-lg shadow-red-600/30 transition-all"
        >
          <Search className="w-5 h-5" />
          Search Them
        </button>
      </div>
    </>
  );
}

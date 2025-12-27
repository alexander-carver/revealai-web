"use client";

import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Search,
  User,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  Loader2,
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

// Convert markdown links to clickable HTML links
function formatAIResponse(text: string): string {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let html = text.replace(linkRegex, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>');
  html = html.replace(/\n/g, "<br/>");
  return html;
}

export function PeopleSearch() {
  const { isPro } = useSubscription();
  const [searchMode, setSearchMode] = useState<SearchMode>("cheater");
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

  // AI Search state (Cheater Buster)
  const [aiQuery, setAiQuery] = useState("");
  const [aiResult, setAiResult] = useState<string | null>(null);

  // Results state
  const [candidates, setCandidates] = useState<PersonSearchCandidate[]>([]);
  const [contactMatches, setContactMatches] = useState<EnformionContactMatch[]>([]);

  // Loading screen state
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [loadingSearchQuery, setLoadingSearchQuery] = useState("");

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
      // Set up pending search and show loading screen
      setLoadingSearchQuery(getSearchDisplayName());
      setShowLoadingScreen(true);
      personSearchMutation.mutate(query);
    } else if (searchMode !== "cheater") {
      setLoadingSearchQuery(getSearchDisplayName());
      setShowLoadingScreen(true);
      contactSearchMutation.mutate(query);
    }
  }, [searchMode, formData, getSearchDisplayName, personSearchMutation, contactSearchMutation]);

  const handleAISearch = useCallback(() => {
    if (!aiQuery.trim()) return;
    
    // Extract a name or short query for display
    const displayQuery = aiQuery.split(" ").slice(0, 4).join(" ");
    setLoadingSearchQuery(displayQuery);
    setShowLoadingScreen(true);
    aiSearchMutation.mutate(aiQuery);
  }, [aiQuery, aiSearchMutation]);

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

  return (
    <section className="relative py-12">
      {/* Background Images - Full Width */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Mobile Background */}
        <div className="md:hidden absolute inset-0">
          <Image
            src="/Reveal_Background_Mobile.png"
            alt=""
            fill
            className="object-cover object-center"
            priority
            unoptimized
          />
          <div className="absolute inset-0 bg-white/60" />
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
          <div className="absolute inset-0 bg-white/60" />
        </div>
      </div>

      {/* Content Container */}
      <div className="container mx-auto px-4 relative z-10">
        {/* Loading Screen Overlay */}
        <SearchLoadingScreen
          isVisible={showLoadingScreen}
          searchQuery={loadingSearchQuery}
          onComplete={handleLoadingComplete}
          onCancel={handleLoadingCancel}
        />

        <Card className="border-primary/20 shadow-xl bg-white/95 backdrop-blur-sm">
        <CardHeader className="pb-6">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary">
              <Sparkles className="w-4 h-4" />
              <span>AI-Powered People Intelligence</span>
            </div>
            <CardTitle className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Discover the truth about{" "}
              <span className="gradient-text">anyone</span>
            </CardTitle>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Search public records, social profiles, background information,
              and more with our comprehensive AI-powered research platform.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={searchMode} onValueChange={(v) => setSearchMode(v as SearchMode)}>
            <TabsList className="w-full grid grid-cols-5 mb-6 h-auto p-1">
              <TabsTrigger value="cheater" className="gap-1 md:gap-2 text-xs md:text-sm py-2">
                <AlertTriangle className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">Find Dating Apps</span>
                <span className="sm:hidden">Cheater</span>
                <span className="hidden md:inline">🚨</span>
              </TabsTrigger>
              <TabsTrigger value="name" className="gap-1 md:gap-2 text-xs md:text-sm py-2">
                <User className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">Name</span>
              </TabsTrigger>
              <TabsTrigger value="phone" className="gap-1 md:gap-2 text-xs md:text-sm py-2">
                <Phone className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">Phone</span>
              </TabsTrigger>
              <TabsTrigger value="email" className="gap-1 md:gap-2 text-xs md:text-sm py-2">
                <Mail className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">Email</span>
              </TabsTrigger>
              <TabsTrigger value="address" className="gap-1 md:gap-2 text-xs md:text-sm py-2">
                <MapPin className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">Address</span>
              </TabsTrigger>
            </TabsList>

            {/* Cheater Buster (AI Search) */}
            <TabsContent value="cheater" className="space-y-4">
              <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <h3 className="font-semibold text-lg">Find Dating Apps and Profiles 🚨</h3>
                </div>
                <p className="text-sm text-muted-foreground">
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
                  className="gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                >
                  <Sparkles className="w-5 h-5" />
                  <span className="hidden sm:inline">Search</span>
                  <span className="sm:hidden">Go</span>
                </Button>
              </div>

              {aiResult && !showLoadingScreen && (
                <div className="mt-4 p-4 rounded-xl bg-card border border-border">
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
                  className="mt-4 gap-2 text-primary border-primary/30 hover:bg-primary/10"
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
              className="w-full mt-6 gap-2"
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
                    <Card className="p-4 hover:border-primary/50 transition-all cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-6 h-6 text-primary" />
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
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
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
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="w-6 h-6 text-primary" />
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
                          <Button variant="outline" size="sm">
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
      </div>
    </section>
  );
}

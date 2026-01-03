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
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchLoadingScreen } from "@/components/shared/search-loading-screen";
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

// Convert markdown links to clickable HTML links
function formatAIResponse(text: string): string {
  // Convert markdown links [text](url) to HTML <a> tags
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let html = text.replace(linkRegex, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>');
  
  // Convert line breaks to <br/>
  html = html.replace(/\n/g, "<br/>");
  
  return html;
}

export default function PeopleSearchPage() {
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

  // AI Search state
  const [aiQuery, setAiQuery] = useState("");
  const [aiResult, setAiResult] = useState<string | null>(null);

  // Results state
  const [candidates, setCandidates] = useState<PersonSearchCandidate[]>([]);
  const [contactMatches, setContactMatches] = useState<EnformionContactMatch[]>([]);

  // Loading screen state
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [loadingSearchQuery, setLoadingSearchQuery] = useState("");
  const [pendingSearch, setPendingSearch] = useState<{ type: "person" | "contact" | "ai"; query?: SearchQuery; aiQuery?: string } | null>(null);

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

  // Start search with loading screen
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
      setPendingSearch({ type: "person", query });
      setLoadingSearchQuery(getSearchDisplayName());
      setShowLoadingScreen(true);
      // Only run the actual search if user is pro
      if (isPro) {
        personSearchMutation.mutate(query);
      }
    } else if (searchMode !== "cheater") {
      setPendingSearch({ type: "contact", query });
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
    
    // Extract a name or short query for display
    const displayQuery = aiQuery.split(" ").slice(0, 4).join(" ");
    setPendingSearch({ type: "ai", aiQuery });
    setLoadingSearchQuery(displayQuery);
    setShowLoadingScreen(true);
    // Only run the actual search if user is pro
    if (isPro) {
      aiSearchMutation.mutate(aiQuery);
    }
  }, [aiQuery, aiSearchMutation, isPro]);

  // Loading screen callbacks
  const handleLoadingComplete = useCallback(() => {
    setShowLoadingScreen(false);
    setPendingSearch(null);
    // Results are already loaded via the mutation, they'll render
  }, []);

  const handleLoadingCancel = useCallback(() => {
    setShowLoadingScreen(false);
    setPendingSearch(null);
    // Clear any pending results
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

  // Don't show inline loading if loading screen is visible
  const showInlineLoading = isLoading && !showLoadingScreen;

  return (
    <div>
      {/* Loading Screen Overlay */}
      <SearchLoadingScreen
        isVisible={showLoadingScreen}
        searchQuery={loadingSearchQuery}
        onComplete={handleLoadingComplete}
        onCancel={handleLoadingCancel}
      />

      <PageHeader
        title="People Search"
        description="Find anyone using name, phone, email, or address"
        icon={Search}
        iconColor="text-blue-500"
        iconBgColor="bg-blue-500/10"
      />

      {/* AI Search Section */}
      <Card className="mb-6 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-primary" />
            AI-Powered Research
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="Ask anything... e.g. 'Find information about John Smith from Austin, TX'"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAISearch()}
              className="flex-1"
            />
            <Button
              onClick={handleAISearch}
              isLoading={aiSearchMutation.isPending && !showLoadingScreen}
              className="gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Search
            </Button>
          </div>

          {aiResult && !showLoadingScreen && (
            <div className="mt-4 p-4 rounded-xl bg-card border border-border">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div dangerouslySetInnerHTML={{ __html: formatAIResponse(aiResult) }} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Traditional Search */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Search Database</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={searchMode} onValueChange={(v) => setSearchMode(v as SearchMode)}>
            <TabsList className="w-full grid grid-cols-5 mb-6">
              <TabsTrigger value="cheater" className="gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="hidden sm:inline">Cheater Buster</span>
                <span className="sm:hidden">Cheater</span>
                <span className="hidden md:inline">🚨</span>
              </TabsTrigger>
              <TabsTrigger value="name" className="gap-2">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Name</span>
              </TabsTrigger>
              <TabsTrigger value="phone" className="gap-2">
                <Phone className="w-4 h-4" />
                <span className="hidden sm:inline">Phone</span>
              </TabsTrigger>
              <TabsTrigger value="email" className="gap-2">
                <Mail className="w-4 h-4" />
                <span className="hidden sm:inline">Email</span>
              </TabsTrigger>
              <TabsTrigger value="address" className="gap-2">
                <MapPin className="w-4 h-4" />
                <span className="hidden sm:inline">Address</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="cheater">
              <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <h3 className="font-semibold text-lg">Cheater Buster 🚨</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Use AI to find everything about someone. Perfect for catching cheaters, verifying identities, and comprehensive background checks.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="Ask anything... e.g. 'Find everything about John Smith from Austin, TX' or 'Tell me about Sarah Johnson who lives in Miami'"
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAISearch()}
                  className="flex-1"
                />
                <Button
                  onClick={handleAISearch}
                  isLoading={aiSearchMutation.isPending && !showLoadingScreen}
                  size="lg"
                  className="gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                >
                  <Sparkles className="w-5 h-5" />
                  Search
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
                    handleAISearch();
                  }}
                >
                  <Sparkles className="w-4 h-4" />
                  AI Search: &quot;Tell me everything about {formData.firstName} {formData.lastName}&quot;
                </Button>
              )}
            </TabsContent>

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
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && !showLoadingScreen && (
        <Alert variant="destructive" className="mt-6">
          {(() => {
            // Extract user-friendly error message
            const err = error as any;
            if (err?.message) {
              // Don't show raw JSON - extract meaningful message
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
      {showInlineLoading && !aiSearchMutation.isPending && (
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
    </div>
  );
}

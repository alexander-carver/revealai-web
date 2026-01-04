"use client";

import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  AtSign,
  Search,
  ArrowRight,
  ExternalLink,
  Check,
  X,
  Clock,
  Globe,
  AlertCircle,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SearchLoadingScreen } from "@/components/shared/search-loading-screen";
import { searchUsername } from "@/lib/services/username-search";
import type { UsernameSearchResponse, UsernameProbe } from "@/lib/types";
import { useSubscription } from "@/hooks/use-subscription";

export default function UsernameSearchPage() {
  const { isPro, showFreeTrialPaywall } = useSubscription();
  const [username, setUsername] = useState("");
  const [results, setResults] = useState<UsernameSearchResponse | null>(null);
  const [filter, setFilter] = useState<"all" | "found" | "not_found">("all");
  
  // Loading screen state
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [loadingSearchQuery, setLoadingSearchQuery] = useState("");

  const searchMutation = useMutation({
    mutationFn: async () => {
      return searchUsername(username);
    },
    onSuccess: (data) => {
      setResults(data);
    },
  });

  const handleSearch = useCallback(() => {
    if (username.trim().length < 2) {
      return;
    }
    
    // Show free trial paywall immediately if not pro
    if (!isPro) {
      showFreeTrialPaywall();
      return;
    }
    
    // Show loading screen and start search
    setLoadingSearchQuery(`@${username}`);
    setShowLoadingScreen(true);
    searchMutation.mutate();
  }, [username, searchMutation, isPro, showFreeTrialPaywall]);

  const handleLoadingComplete = useCallback(() => {
    setShowLoadingScreen(false);
  }, []);

  const handleLoadingCancel = useCallback(() => {
    setShowLoadingScreen(false);
    setResults(null);
  }, []);

  const filteredProfiles =
    results?.profiles.filter((p) => {
      if (filter === "found") return p.exists;
      if (filter === "not_found") return !p.exists;
      return true;
    }) || [];

  const foundCount = results?.profiles.filter((p) => p.exists).length || 0;
  const notFoundCount = results?.profiles.filter((p) => !p.exists).length || 0;

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
        title="Username Search"
        description="Find social profiles across 100+ platforms"
        icon={AtSign}
        iconColor="text-purple-500"
        iconBgColor="bg-purple-500/10"
      />

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search Username</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="Enter username (without @)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              icon={<AtSign className="w-4 h-4" />}
              className="flex-1"
            />
            <Button
              onClick={handleSearch}
              isLoading={searchMutation.isPending && !showLoadingScreen}
              size="lg"
              className="gap-2"
            >
              <Search className="w-5 h-5" />
              Search
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            We&apos;ll check if this username exists on popular social media
            platforms, forums, and websites.
          </p>
        </CardContent>
      </Card>

      {/* Error Message */}
      {searchMutation.error && !showLoadingScreen && (
        <Alert variant="destructive" className="mt-6">
          {(searchMutation.error as Error).message ||
            "An error occurred during the search"}
        </Alert>
      )}

      {/* Loading State (inline, hidden when full loading screen is shown) */}
      {searchMutation.isPending && !showLoadingScreen && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">
              Searching platforms...
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-16 mt-1" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {results && !showLoadingScreen && (
        <div className="mt-6">
          {/* Stats Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-semibold">
                Results for @{results.username}
              </h2>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <Check className="w-4 h-4 text-success" />
                  {foundCount} found
                </span>
                <span className="flex items-center gap-1">
                  <X className="w-4 h-4 text-destructive" />
                  {notFoundCount} not found
                </span>
                {results.tookMs && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {results.tookMs}ms
                  </span>
                )}
              </div>
            </div>

            {/* Filter Tabs */}
            <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <TabsList>
                <TabsTrigger value="all">All ({results.profiles.length})</TabsTrigger>
                <TabsTrigger value="found">Found ({foundCount})</TabsTrigger>
                <TabsTrigger value="not_found">Not Found ({notFoundCount})</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Profile Grid */}
          {filteredProfiles.length === 0 ? (
            <Alert variant="info">
              No profiles match this filter.
            </Alert>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredProfiles.map((probe) => (
                <ProfileCard key={probe.site} probe={probe} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ProfileCard({ probe }: { probe: UsernameProbe }) {
  return (
    <Card
      className={`p-4 transition-all ${
        probe.exists
          ? "hover:border-success/50 cursor-pointer"
          : "opacity-60"
      }`}
    >
      {probe.exists && probe.url ? (
        <a
          href={probe.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <ProfileCardContent probe={probe} />
        </a>
      ) : (
        <ProfileCardContent probe={probe} />
      )}
    </Card>
  );
}

function ProfileCardContent({ probe }: { probe: UsernameProbe }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          probe.exists ? "bg-success/10" : "bg-muted"
        }`}
      >
        <Globe
          className={`w-5 h-5 ${
            probe.exists ? "text-success" : "text-muted-foreground"
          }`}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{probe.display}</span>
          {probe.exists && probe.url && (
            <ExternalLink className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          {probe.exists ? (
            <Badge variant="success" className="text-xs">
              <Check className="w-3 h-3 mr-1" />
              Found
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">
              <X className="w-3 h-3 mr-1" />
              Not Found
            </Badge>
          )}
          {probe.confidence > 0 && probe.exists && (
            <span className="text-xs text-muted-foreground">
              {Math.round(probe.confidence * 100)}% confident
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

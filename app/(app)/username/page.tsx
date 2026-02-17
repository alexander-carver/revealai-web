"use client";

import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  AtSign,
  Search,
  ArrowRight,
  ExternalLink,
  Globe,
  Shield,
  Clock,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { SearchLoadingScreen } from "@/components/shared/search-loading-screen";
import { FullReportResult } from "@/components/shared/full-report-result";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";

export default function UsernameSearchPage() {
  const { user } = useAuth();
  const { isPro, showFreeTrialPaywall } = useSubscription();
  const [username, setUsername] = useState("");
  const [searchResult, setSearchResult] = useState<string | null>(null);
  const [searchCount, setSearchCount] = useState(0);

  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [loadingSearchQuery, setLoadingSearchQuery] = useState("");

  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await fetch("/api/perplexity/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          userId: user?.id,
          usePro: searchCount < 3,
          isPro: isPro || false,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        if (response.status === 429) {
          throw new Error(error.message || "Rate limit exceeded. Please try again later.");
        }
        throw new Error(error.error || "Search failed");
      }

      const data = await response.json();
      return data.content;
    },
    onSuccess: (data) => {
      setSearchResult(data);
      setSearchCount((prev) => prev + 1);
    },
  });

  const handleSearch = useCallback(() => {
    const trimmed = username.trim().replace("@", "");
    if (trimmed.length < 2) return;

    if (!isPro) {
      showFreeTrialPaywall();
      return;
    }

    const query = `Search for the username "${trimmed}" across all major social media platforms and websites. For each platform where you find an active profile, provide:
- The platform name and direct URL to the profile
- A brief description of the account (bio, follower count, activity level if visible)

Check these platforms: Instagram, Twitter/X, TikTok, YouTube, Facebook, LinkedIn, Reddit, GitHub, Snapchat, Pinterest, Twitch, Discord, Telegram, Medium, Tumblr, SoundCloud, Spotify, Steam, PlayStation Network, Xbox Live, and any other platforms where this username appears.

Also provide a summary of the person's online presence and any connections between the accounts (same profile picture, similar bio, etc.).`;

    setLoadingSearchQuery(`@${trimmed}`);
    setShowLoadingScreen(true);
    searchMutation.mutate(query);
  }, [username, isPro, showFreeTrialPaywall, searchMutation, searchCount]);

  const handleLoadingComplete = useCallback(() => {
    setShowLoadingScreen(false);
  }, []);

  const handleLoadingCancel = useCallback(() => {
    setShowLoadingScreen(false);
    setSearchResult(null);
  }, []);

  return (
    <div>
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
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Search Username</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Enter any username to find their profiles across social media, forums, and websites
          </p>
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

          {/* Quick Info Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            {[
              { icon: Globe, label: "100+ Platforms", color: "text-purple-500", bg: "bg-purple-500/10" },
              { icon: Users, label: "Social Profiles", color: "text-blue-500", bg: "bg-blue-500/10" },
              { icon: ExternalLink, label: "Direct Links", color: "text-green-500", bg: "bg-green-500/10" },
              { icon: Shield, label: "Private Search", color: "text-rose-500", bg: "bg-rose-500/10" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <div className={`p-1.5 rounded-lg ${item.bg}`}>
                  <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {searchMutation.error && !showLoadingScreen && (
        <Alert variant="destructive" className="mt-6">
          {searchMutation.error.message || "Search failed. Please try again."}
        </Alert>
      )}

      {/* Results */}
      {searchResult && !showLoadingScreen && (
        <div className="mt-6">
          <FullReportResult
            content={searchResult}
            searchCount={searchCount}
            personName={`@${username.trim().replace("@", "")}`}
          />
        </div>
      )}

      {/* Info Section */}
      {!searchResult && !showLoadingScreen && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Globe className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Cross-Platform Search</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Search across Instagram, TikTok, X, YouTube, Reddit, GitHub, and dozens more.
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Profile Analysis</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Get details on profile activity, follower counts, and account connections.
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Clock className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Instant Results</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Get comprehensive results in seconds, powered by AI research.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

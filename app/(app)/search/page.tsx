"use client";

import { useState, useCallback, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Search,
  User,
  MapPin,
  ArrowRight,
  FileText,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import dynamic from "next/dynamic";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { FullReportResult } from "@/components/shared/full-report-result";
import { addSearchHistoryItem } from "@/lib/search-history";

// Lazy load SearchLoadingScreen to reduce initial bundle size
const SearchLoadingScreen = dynamic(
  () => import("@/components/shared/search-loading-screen").then((mod) => ({ default: mod.SearchLoadingScreen })),
  { ssr: false }
);

export default function PeopleSearchPage() {
  const { user } = useAuth();
  const { isPro, showFreeTrialPaywall } = useSubscription();
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    city: "",
    state: "",
  });

  // Results state
  const [searchResult, setSearchResult] = useState<string | null>(null);
  const [searchCount, setSearchCount] = useState(0);

  // Loading screen state
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [loadingSearchQuery, setLoadingSearchQuery] = useState("");

  // Auto-populate form fields into search query
  useEffect(() => {
    // This effect is just for demonstration - actual population happens in handleSearch
  }, [formData]);

  // Perplexity search mutation
  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      const usePro = searchCount < 3; // First 3 searches use Pro
      
      const response = await fetch("/api/perplexity/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          userId: user?.id,
          usePro,
          isPro: isPro || false,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        
        // Handle rate limit error
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
      addSearchHistoryItem({
        query: `${formData.firstName} ${formData.lastName}`,
        type: "people",
        preview: data.substring(0, 80),
      });
    },
  });

  // Handle main search
  const handleSearch = useCallback(() => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      return;
    }

    // Show free trial paywall immediately if not pro
    if (!isPro) {
      showFreeTrialPaywall();
      return;
    }

    // Build query string
    const name = `${formData.firstName} ${formData.lastName}`;
    const location = [formData.city, formData.state].filter(Boolean).join(", ");
    const query = location
      ? `Tell me everything about ${name} from ${location}`
      : `Tell me everything about ${name}`;

    // Show loading screen
    setLoadingSearchQuery(name);
    setShowLoadingScreen(true);
    searchMutation.mutate(query);
  }, [formData, isPro, showFreeTrialPaywall, searchMutation]);

  // Handle follow-up search
  const handleFollowUpSearch = useCallback((suggestion: string) => {
    if (!isPro) {
      showFreeTrialPaywall();
      return;
    }

    const name = `${formData.firstName} ${formData.lastName}`;
    const location = [formData.city, formData.state].filter(Boolean).join(", ");
    const baseContext = location ? `${name} from ${location}` : name;
    const query = `${suggestion} for ${baseContext}`;

    setLoadingSearchQuery(suggestion);
    setShowLoadingScreen(true);
    searchMutation.mutate(query);
  }, [formData, isPro, showFreeTrialPaywall, searchMutation]);

  // Loading screen callbacks
  const handleLoadingComplete = useCallback(() => {
    setShowLoadingScreen(false);
  }, []);

  const handleLoadingCancel = useCallback(() => {
    setShowLoadingScreen(false);
    setSearchResult(null);
  }, []);

  const error = searchMutation.error;

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
        title="Full Report"
        description="Get comprehensive people intelligence powered by AI"
        icon={FileText}
        iconColor="text-primary"
        iconBgColor="bg-primary/10"
      />

      {/* Search Form */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Enter Person Details</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Fill in the details below to generate a comprehensive report
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="First Name *"
              value={formData.firstName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, firstName: e.target.value }))
              }
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              icon={<User className="w-4 h-4" />}
            />
            <Input
              placeholder="Last Name *"
              value={formData.lastName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, lastName: e.target.value }))
              }
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              icon={<User className="w-4 h-4" />}
            />
            <Input
              placeholder="City (optional)"
              value={formData.city}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, city: e.target.value }))
              }
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              icon={<MapPin className="w-4 h-4" />}
            />
            <Input
              placeholder="State (optional)"
              value={formData.state}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, state: e.target.value }))
              }
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              icon={<MapPin className="w-4 h-4" />}
            />
          </div>

          <Button
            onClick={handleSearch}
            disabled={!formData.firstName.trim() || !formData.lastName.trim()}
            isLoading={searchMutation.isPending && !showLoadingScreen}
            size="lg"
            className="w-full mt-6 gap-2"
          >
            <Search className="w-5 h-5" />
            Generate Full Report
            <ArrowRight className="w-4 h-4" />
          </Button>

          {/* Preview of query */}
          {formData.firstName && formData.lastName && (
            <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Searching for:</span> Tell me everything about{" "}
                {formData.firstName} {formData.lastName}
                {formData.city || formData.state
                  ? ` from ${[formData.city, formData.state].filter(Boolean).join(", ")}`
                  : ""}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && !showLoadingScreen && (
        <Alert variant="destructive" className="mt-6">
          {error.message || "Search failed. Please try again."}
        </Alert>
      )}

      {/* Search Results */}
      {searchResult && !showLoadingScreen && (
        <div className="mt-6">
          <FullReportResult
            content={searchResult}
            onFollowUpSearch={searchCount < 3 ? handleFollowUpSearch : undefined}
            searchCount={searchCount}
          />
        </div>
      )}
    </div>
  );
}

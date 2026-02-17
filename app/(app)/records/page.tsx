"use client";

import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  FileText,
  User,
  MapPin,
  Calendar,
  Search,
  ArrowRight,
  Scale,
  AlertTriangle,
  Shield,
  Clock,
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

export default function RecordsSearchPage() {
  const { user } = useAuth();
  const { isPro, showFreeTrialPaywall } = useSubscription();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    city: "",
    state: "",
    dob: "",
  });
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
    if (!formData.firstName.trim() || !formData.lastName.trim()) return;

    if (!isPro) {
      showFreeTrialPaywall();
      return;
    }

    const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
    const location = [formData.city.trim(), formData.state.trim().toUpperCase()]
      .filter(Boolean)
      .join(", ");
    const dobInfo = formData.dob.trim() ? `, date of birth ${formData.dob.trim()}` : "";

    const query = `Search for any public court records, criminal records, civil records, traffic violations, bankruptcy filings, liens, judgments, and other legal records for ${fullName}${location ? ` from ${location}` : ""}${dobInfo}.

Please provide:
1. Any criminal records (felonies, misdemeanors, arrests)
2. Civil court cases (lawsuits, disputes, small claims)
3. Traffic violations and DUI records
4. Bankruptcy filings
5. Tax liens and judgments
6. Sex offender registry check
7. Any other public legal records

For each record found, include the case number, date, jurisdiction, status, and a brief description. If no records are found in a category, state that clearly. Search federal, state, and local databases.`;

    setLoadingSearchQuery(fullName);
    setShowLoadingScreen(true);
    searchMutation.mutate(query);
  }, [formData, isPro, showFreeTrialPaywall, searchMutation, searchCount]);

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
        title="Records Search"
        description="Search court records, criminal history, and public filings"
        icon={FileText}
        iconColor="text-amber-500"
        iconBgColor="bg-amber-500/10"
      />

      {/* Search Form */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Search Public Records</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Search court records, criminal history, civil cases, and more
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
              placeholder="State (optional, e.g. TX)"
              value={formData.state}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, state: e.target.value }))
              }
              icon={<MapPin className="w-4 h-4" />}
              maxLength={2}
            />
            <Input
              placeholder="Date of Birth (optional, MM/DD/YYYY)"
              value={formData.dob}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, dob: e.target.value }))
              }
              icon={<Calendar className="w-4 h-4" />}
            />
          </div>

          <Button
            onClick={handleSearch}
            isLoading={searchMutation.isPending && !showLoadingScreen}
            size="lg"
            className="w-full mt-6 gap-2"
          >
            <Search className="w-5 h-5" />
            Search Records
            <ArrowRight className="w-4 h-4" />
          </Button>
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
            personName={`${formData.firstName} ${formData.lastName}`.trim()}
          />
        </div>
      )}

      {/* Info Section */}
      {!searchResult && !showLoadingScreen && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Scale className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Court Records</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Search criminal, civil, traffic, and bankruptcy records across federal and state databases.
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Shield className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Comprehensive Search</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Includes arrests, liens, judgments, sex offender registry, and more.
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
                <h3 className="font-semibold text-sm">AI-Powered Results</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Our AI searches multiple databases to compile a comprehensive report.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

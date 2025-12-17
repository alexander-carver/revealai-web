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
  Clock,
  Hash,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchLoadingScreen } from "@/components/shared/search-loading-screen";
import { searchRecords, normalizeDob } from "@/lib/services/records-search";
import type { RecordsSearchResponse, CourtRecord } from "@/lib/types";
import { useSubscription } from "@/hooks/use-subscription";
import { formatDate } from "@/lib/utils";

const categoryColors: Record<string, { bg: string; text: string }> = {
  Criminal: { bg: "bg-red-500/10", text: "text-red-500" },
  Civil: { bg: "bg-blue-500/10", text: "text-blue-500" },
  Traffic: { bg: "bg-amber-500/10", text: "text-amber-500" },
  Bankruptcy: { bg: "bg-purple-500/10", text: "text-purple-500" },
  default: { bg: "bg-muted", text: "text-muted-foreground" },
};

export default function RecordsSearchPage() {
  const { isPro } = useSubscription();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    city: "",
    state: "",
    dob: "",
  });
  const [results, setResults] = useState<RecordsSearchResponse | null>(null);
  
  // Loading screen state
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [loadingSearchQuery, setLoadingSearchQuery] = useState("");

  const searchMutation = useMutation({
    mutationFn: async () => {
      const request = {
        person: {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          dob: normalizeDob(formData.dob),
          city: formData.city.trim() || undefined,
          state: formData.state.trim().toUpperCase() || undefined,
        },
      };
      return searchRecords(request);
    },
    onSuccess: (data) => {
      setResults(data);
    },
  });

  const handleSearch = useCallback(() => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      return;
    }
    
    // Show loading screen and start search
    const displayName = `${formData.firstName} ${formData.lastName}`.trim();
    setLoadingSearchQuery(displayName);
    setShowLoadingScreen(true);
    searchMutation.mutate();
  }, [formData.firstName, formData.lastName, searchMutation]);

  const handleLoadingComplete = useCallback(() => {
    setShowLoadingScreen(false);
  }, []);

  const handleLoadingCancel = useCallback(() => {
    setShowLoadingScreen(false);
    setResults(null);
  }, []);

  const getCategoryStyle = (category: string) => {
    return categoryColors[category] || categoryColors.default;
  };

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
        title="Records Search"
        description="Search court records, criminal history, and public filings"
        icon={FileText}
        iconColor="text-amber-500"
        iconBgColor="bg-amber-500/10"
      />

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search Records</CardTitle>
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

      {/* Error Message */}
      {searchMutation.error && !showLoadingScreen && (
        <Alert variant="destructive" className="mt-6">
          {(searchMutation.error as Error).message ||
            "An error occurred during the search"}
        </Alert>
      )}

      {/* Loading State (inline, hidden when full loading screen is shown) */}
      {searchMutation.isPending && !showLoadingScreen && (
        <div className="mt-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-20 h-6 rounded-full" />
                  <Skeleton className="h-5 w-48" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Results */}
      {results && !showLoadingScreen && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              Found {results.records.length} record
              {results.records.length !== 1 ? "s" : ""}
            </h2>
            {results.tookMs && (
              <span className="text-sm text-muted-foreground">
                <Clock className="w-4 h-4 inline mr-1" />
                {results.tookMs}ms
              </span>
            )}
          </div>

          {results.records.length === 0 ? (
            <Alert variant="info">
              No records found for this person. This is good news!
            </Alert>
          ) : (
            <div className="space-y-4">
              {results.records.map((record) => (
                <RecordCard key={record.id} record={record} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RecordCard({ record }: { record: CourtRecord }) {
  const categoryColors: Record<string, { bg: string; text: string }> = {
    Criminal: { bg: "bg-red-500/10", text: "text-red-500" },
    Civil: { bg: "bg-blue-500/10", text: "text-blue-500" },
    Traffic: { bg: "bg-amber-500/10", text: "text-amber-500" },
    Bankruptcy: { bg: "bg-purple-500/10", text: "text-purple-500" },
    default: { bg: "bg-muted", text: "text-muted-foreground" },
  };

  const style = categoryColors[record.category] || categoryColors.default;

  return (
    <Card className="hover:border-primary/30 transition-colors">
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Category Icon */}
          <div
            className={`flex-shrink-0 w-12 h-12 rounded-xl ${style.bg} flex items-center justify-center`}
          >
            <Scale className={`w-6 h-6 ${style.text}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge className={`${style.bg} ${style.text} border-0`}>
                {record.category}
              </Badge>
              {record.status && (
                <Badge variant="outline" className="text-xs">
                  {record.status}
                </Badge>
              )}
            </div>

            {record.description && (
              <p className="text-sm mb-3">{record.description}</p>
            )}

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {record.caseNumber && (
                <span className="flex items-center gap-1">
                  <Hash className="w-4 h-4" />
                  {record.caseNumber}
                </span>
              )}
              {record.filedDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(record.filedDate)}
                </span>
              )}
              {record.jurisdiction && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {record.jurisdiction}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

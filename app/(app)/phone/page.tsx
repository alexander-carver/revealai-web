"use client";

import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Phone,
  Search,
  ArrowRight,
  Shield,
  AlertTriangle,
  Clock,
  MapPin,
  User,
  Globe,
  Ban,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { SearchLoadingScreen } from "@/components/shared/search-loading-screen";
import { FullReportResult } from "@/components/shared/full-report-result";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";

function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits[0] === "1") {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

export default function PhoneLookupPage() {
  const { user } = useAuth();
  const { isPro, showFreeTrialPaywall } = useSubscription();
  const [phoneNumber, setPhoneNumber] = useState("");
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
    const digits = phoneNumber.replace(/\D/g, "");
    if (digits.length < 10) return;

    if (!isPro) {
      showFreeTrialPaywall();
      return;
    }

    const formatted = formatPhoneDisplay(phoneNumber);
    const query = `Who owns the phone number ${formatted}? Provide the owner's name, location, carrier, phone type (landline/mobile/VoIP), and any associated public records or social profiles. Also check if this number has been reported as spam or scam.`;

    setLoadingSearchQuery(formatted);
    setShowLoadingScreen(true);
    searchMutation.mutate(query);
  }, [phoneNumber, isPro, showFreeTrialPaywall, searchMutation, searchCount]);

  const handleLoadingComplete = useCallback(() => {
    setShowLoadingScreen(false);
  }, []);

  const handleLoadingCancel = useCallback(() => {
    setShowLoadingScreen(false);
    setSearchResult(null);
  }, []);

  const handlePhoneInput = (value: string) => {
    // Allow only digits, spaces, dashes, parentheses, and plus
    const cleaned = value.replace(/[^\d\s\-()+ ]/g, "");
    setPhoneNumber(cleaned);
  };

  const digits = phoneNumber.replace(/\D/g, "");
  const isValidLength = digits.length >= 10;

  return (
    <div>
      <SearchLoadingScreen
        isVisible={showLoadingScreen}
        searchQuery={loadingSearchQuery}
        onComplete={handleLoadingComplete}
        onCancel={handleLoadingCancel}
      />

      <PageHeader
        title="Reverse Phone Lookup"
        description="Find out who owns any phone number instantly"
        icon={Phone}
        iconColor="text-cyan-500"
        iconBgColor="bg-cyan-500/10"
      />

      {/* Search Form */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Enter Phone Number</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Enter any US phone number to identify the owner
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="(555) 123-4567"
              value={phoneNumber}
              onChange={(e) => handlePhoneInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              icon={<Phone className="w-4 h-4" />}
              className="flex-1 font-mono text-lg"
              maxLength={20}
            />
            <Button
              onClick={handleSearch}
              disabled={!isValidLength}
              isLoading={searchMutation.isPending && !showLoadingScreen}
              size="lg"
              className="gap-2"
            >
              <Search className="w-5 h-5" />
              Lookup
            </Button>
          </div>

          {/* Quick Info Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            {[
              { icon: User, label: "Owner Name", color: "text-blue-500", bg: "bg-blue-500/10" },
              { icon: MapPin, label: "Location", color: "text-green-500", bg: "bg-green-500/10" },
              { icon: Globe, label: "Carrier Info", color: "text-purple-500", bg: "bg-purple-500/10" },
              { icon: Ban, label: "Spam Check", color: "text-red-500", bg: "bg-red-500/10" },
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
            personName={formatPhoneDisplay(phoneNumber)}
          />
        </div>
      )}

      {/* Info Section */}
      {!searchResult && !showLoadingScreen && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Identify Spam Calls</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Check if a number has been reported as spam, scam, or robocall.
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
                <h3 className="font-semibold text-sm">Stay Safe</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Verify unknown callers before calling back or sharing personal info.
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
                  Get owner info, carrier details, and location in seconds.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

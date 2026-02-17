"use client";

import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Shield,
  Eye,
  Search,
  ArrowRight,
  AlertTriangle,
  Lock,
  Globe,
  User,
  Mail,
  Phone,
  MapPin,
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

export default function PrivacyScanPage() {
  const { user } = useAuth();
  const { isPro, showFreeTrialPaywall } = useSubscription();
  const [formData, setFormData] = useState({
    fullName: "",
    city: "",
    state: "",
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
          usePro: true,
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
    if (!formData.fullName.trim()) return;

    if (!isPro) {
      showFreeTrialPaywall();
      return;
    }

    const location = [formData.city.trim(), formData.state.trim().toUpperCase()]
      .filter(Boolean)
      .join(", ");

    const query = `Perform a comprehensive privacy and data exposure scan for "${formData.fullName.trim()}"${location ? ` from ${location}` : ""}.

Search for their personal information across data broker sites and public databases. Check the following:

1. **Data Broker Exposure**: Check if their information appears on major data broker sites like Spokeo, BeenVerified, WhitePages, TruePeopleSearch, FastPeopleSearch, Radaris, Intelius, PeopleFinder, AnyWho, USSearch, ZabaSearch, PeopleSmart, etc.

2. **Personal Information Leaked**: Identify what types of personal data are publicly available:
   - Full name and aliases
   - Phone numbers
   - Email addresses
   - Home addresses (current and past)
   - Social media profiles
   - Family members / relatives
   - Employment history
   - Age / date of birth

3. **Social Media Exposure**: Check what personal information is publicly visible on their social media profiles (Facebook, Instagram, LinkedIn, Twitter/X, etc.)

4. **Data Breach History**: Check if their name or likely email addresses have appeared in known data breaches.

5. **Public Records**: Note any publicly accessible court records, property records, or other government records.

6. **Risk Assessment**: Provide an overall privacy risk rating (Low / Moderate / High / Critical) based on the amount and sensitivity of exposed information.

7. **Actionable Recommendations**: Provide specific steps they can take to reduce their exposure, including which data brokers to request removal from and how.

Format the results clearly with sections for each category. Be thorough and specific about where their information was found.`;

    setLoadingSearchQuery(formData.fullName.trim());
    setShowLoadingScreen(true);
    searchMutation.mutate(query);
  }, [formData, isPro, showFreeTrialPaywall, searchMutation]);

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
        title="Privacy Scan"
        description="Find out how exposed your personal information is online"
        icon={Eye}
        iconColor="text-rose-500"
        iconBgColor="bg-rose-500/10"
      />

      {/* Info Banner */}
      <Alert className="mb-6 border-amber-200 bg-amber-50 text-amber-800">
        <AlertTriangle className="w-4 h-4" />
        <div className="ml-2">
          <p className="font-medium text-sm">Why run a privacy scan?</p>
          <p className="text-xs mt-1">
            Data brokers collect and sell your personal information without your consent. 
            A privacy scan reveals exactly where your data is exposed so you can take action to remove it.
          </p>
        </div>
      </Alert>

      {/* Search Form */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-rose-500" />
            Scan Your Digital Footprint
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Enter your name to see what personal information is publicly available about you
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3">
              <Input
                placeholder="Full Name *"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, fullName: e.target.value }))
                }
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                icon={<User className="w-4 h-4" />}
                className="text-lg"
              />
            </div>
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
          </div>

          <Button
            onClick={handleSearch}
            isLoading={searchMutation.isPending && !showLoadingScreen}
            size="lg"
            className="w-full mt-6 gap-2 bg-rose-600 hover:bg-rose-700"
          >
            <Eye className="w-5 h-5" />
            Run Privacy Scan
            <ArrowRight className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Error */}
      {searchMutation.error && !showLoadingScreen && (
        <Alert variant="destructive" className="mt-6">
          {searchMutation.error.message || "Scan failed. Please try again."}
        </Alert>
      )}

      {/* Results */}
      {searchResult && !showLoadingScreen && (
        <div className="mt-6">
          <FullReportResult
            content={searchResult}
            searchCount={searchCount}
            personName={formData.fullName.trim()}
          />
        </div>
      )}

      {/* What We Check Section */}
      {!searchResult && !showLoadingScreen && (
        <>
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">What We Check</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: Globe, label: "Data Broker Sites", desc: "Spokeo, BeenVerified, WhitePages, and 50+ more", color: "text-blue-500", bg: "bg-blue-500/10" },
                { icon: Mail, label: "Email Exposure", desc: "Data breaches, leaked credentials, and spam lists", color: "text-red-500", bg: "bg-red-500/10" },
                { icon: Phone, label: "Phone Numbers", desc: "Reverse phone directories and caller ID databases", color: "text-green-500", bg: "bg-green-500/10" },
                { icon: MapPin, label: "Address History", desc: "Property records, previous addresses, and mapping sites", color: "text-amber-500", bg: "bg-amber-500/10" },
                { icon: User, label: "Social Media", desc: "Public profile information across all platforms", color: "text-purple-500", bg: "bg-purple-500/10" },
                { icon: Lock, label: "Dark Web", desc: "Leaked credentials and compromised accounts", color: "text-rose-500", bg: "bg-rose-500/10" },
              ].map((item, i) => (
                <Card key={i} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${item.bg}`}>
                      <item.icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{item.label}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <Card className="mt-8 p-6 bg-muted/30 border-dashed">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-rose-500/10">
                <Shield className="w-8 h-8 text-rose-500" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Take Control of Your Privacy</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  After your scan, we provide actionable steps to remove your information from data brokers 
                  and reduce your digital footprint. Most removals can be completed in minutes.
                </p>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

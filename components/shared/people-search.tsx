"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  User,
  MapPin,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Star,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useSubscription } from "@/hooks/use-subscription";
import { MostSearched } from "./most-searched";
import { trackSearchButtonClick } from "@/lib/analytics";
import { SearchLoadingScreen } from "./search-loading-screen";

export function PeopleSearch() {
  const router = useRouter();
  const { isPro, showFreeTrialPaywall, isFreeTrialPaywallVisible } = useSubscription();
  const [searchType, setSearchType] = useState<"fullreport" | "datingapps">("fullreport");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    city: "",
    state: "",
  });

  // Loading screen state for non-Pro users
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const paywallWasShown = useRef(false);

  // Mobile sticky CTA visibility
  const [showMobileCTA, setShowMobileCTA] = useState(true);

  // Track when paywall becomes visible
  useEffect(() => {
    if (isFreeTrialPaywallVisible && showLoadingScreen) {
      paywallWasShown.current = true;
    }
  }, [isFreeTrialPaywallVisible, showLoadingScreen]);

  // Close loading screen when paywall is closed (only if paywall was actually shown)
  useEffect(() => {
    if (!isFreeTrialPaywallVisible && paywallWasShown.current && showLoadingScreen) {
      setShowLoadingScreen(false);
      paywallWasShown.current = false; // Reset for next time
    }
  }, [isFreeTrialPaywallVisible, showLoadingScreen]);

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

  // Handle main search
  const handleSearch = useCallback(() => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      return;
    }

    // Track search button click
    trackSearchButtonClick(searchType === 'fullreport' ? 'full_report' : 'dating_apps');

    const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;

    // NON-PRO USERS: Show loading screen on homepage, then paywall after 8 seconds
    if (!isPro) {
      setSearchQuery(fullName);
      setShowLoadingScreen(true);
      
      // After 8 seconds, show paywall (loading screen stays visible until paywall closes)
      setTimeout(() => {
        showFreeTrialPaywall();
      }, 8000);
      return;
    }

    // PRO USERS: Navigate to search results page
    const params = new URLSearchParams({
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      type: searchType,
    });

    if (formData.city.trim()) {
      params.set("city", formData.city.trim());
    }
    if (formData.state.trim()) {
      params.set("state", formData.state.trim());
    }

    router.push(`/search/result?${params.toString()}`);
  }, [formData, searchType, router, isPro, showFreeTrialPaywall]);

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

  // Show loading screen for non-Pro users
  if (showLoadingScreen) {
    return (
      <SearchLoadingScreen
        isVisible={showLoadingScreen}
        searchQuery={searchQuery}
        onComplete={() => {}} // Do nothing on complete - paywall will handle flow
        onCancel={() => setShowLoadingScreen(false)}
      />
    );
  }

  return (
    <>
      {/* ========================================
          HERO SECTION - TEMPORARILY DISABLED
          ======================================== */}
      {/* <section className="relative min-h-[85vh] md:min-h-[80vh] flex items-center overflow-hidden"> */}
        {/* Background Images - COMMENTED OUT FOR NOW */}
        {/* <div className="absolute inset-0 pointer-events-none">
          <div className="md:hidden absolute inset-0">
            <Image
              src="/New_Background_RevealAIMobile.png"
              alt=""
              fill
              className="object-cover object-top"
              priority
              quality={90}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-white/40" />
          </div>
          <div className="hidden md:block absolute inset-0">
            <Image
              src="/New_Background_RevealAIWeb.png"
              alt=""
              fill
              className="object-cover object-center"
              priority
              quality={90}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-white/50" />
          </div>
        </div> */}

        {/* Hero Content - COMMENTED OUT FOR NOW */}
        {/* <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-xl md:max-w-2xl mx-auto text-center py-8 md:py-0">
            <p className="text-sm md:text-base font-medium text-gray-600 tracking-wide mb-3 md:mb-4">
              Reveal AI — People Search
            </p>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-red-600 leading-tight mb-3 md:mb-4">
              Find Everything,
              <br />
              about Anyone
            </h1>

            <p className="text-lg md:text-xl text-gray-700 font-medium mb-6 md:mb-8">
              Tinder • Bumble • Grindr + more
            </p>

            <div className="space-y-3 md:space-y-4 mb-8 md:mb-10 max-w-xl mx-auto">
              <div className="flex items-start gap-3 text-left">
                <div className="flex-shrink-0 w-6 h-6 rounded bg-red-500 flex items-center justify-center mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <span className="text-base md:text-lg font-bold text-gray-900">People Search: </span>
                  <span className="text-base md:text-lg text-gray-700">Phone • Vehicle • Address</span>
                </div>
              </div>

              <div className="flex items-start gap-3 text-left">
                <div className="flex-shrink-0 w-6 h-6 rounded bg-red-500 flex items-center justify-center mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-base md:text-lg font-bold text-gray-900">Criminal History & Records</span>
              </div>

              <div className="flex items-start gap-3 text-left">
                <div className="flex-shrink-0 w-6 h-6 rounded bg-red-500 flex items-center justify-center mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <span className="text-base md:text-lg font-bold text-gray-900">Opt-Out: </span>
                  <span className="text-base md:text-lg text-gray-700">Remove Yourself From Search</span>
                </div>
              </div>

              <div className="flex items-start gap-3 text-left">
                <div className="flex-shrink-0 w-6 h-6 rounded bg-red-500 flex items-center justify-center mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-base md:text-lg font-bold text-gray-900">Find Unclaimed Money <span className="text-gray-700">(Free)</span></span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3">
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
        </div>
      </section> */}

      {/* ========================================
          SEARCH SECTION
          ======================================== */}
      <section id="search" className="min-h-screen flex items-center justify-center py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card className="border-0 shadow-2xl bg-white">
            <CardHeader className="pb-4 md:pb-6">
              <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 border border-red-100 text-sm text-red-600 font-medium">
                  <Sparkles className="w-4 h-4" />
                  <span>AI-Powered Search</span>
                </div>
                <CardTitle className="text-2xl md:text-3xl font-bold text-gray-900">
                  Search to <span className="text-red-600">Find Dirt</span> on Anyone
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={searchType} onValueChange={(v) => setSearchType(v as "fullreport" | "datingapps")}>
                <TabsList className="w-full grid grid-cols-2 mb-6 h-auto p-1 bg-gray-100">
                  <TabsTrigger value="fullreport" className="gap-1 md:gap-2 text-xs md:text-sm py-2.5 data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm">
                    <Search className="w-4 h-4 md:w-5 md:h-5" />
                    <span>Full Report</span>
                  </TabsTrigger>
                  <TabsTrigger value="datingapps" className="gap-1 md:gap-2 text-xs md:text-sm py-2.5 data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm">
                    <AlertTriangle className="w-4 h-4 md:w-5 md:h-5" />
                    <span>Dating Apps</span>
                  </TabsTrigger>
                </TabsList>

                {/* Full Report Search */}
                <TabsContent value="fullreport">
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
                </TabsContent>

                {/* Dating Apps Search */}
                <TabsContent value="datingapps">
                  <div className="bg-gradient-to-br from-red-50 to-red-100/50 border border-red-200 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      <h3 className="font-semibold text-lg text-gray-900">Find Dating App Profiles</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      Search Tinder, Bumble, Hinge, Match, eHarmony, OkCupid, Plenty of Fish, Grindr, and more.
                    </p>
                  </div>
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
                </TabsContent>
              </Tabs>

              {/* Search Button */}
              <Button
                onClick={handleSearch}
                size="lg"
                className="w-full mt-6 gap-2 bg-red-600 hover:bg-red-700 text-white shadow-lg"
              >
                <Search className="w-5 h-5" />
                Search Records
                <ArrowRight className="w-4 h-4" />
              </Button>
              
              {/* Trust Indicators */}
              <div className="flex items-center justify-center gap-3 text-xs text-gray-600 mt-4">
                <div className="flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-green-600" />
                  <span className="font-medium">Trusted</span>
                </div>
                <span className="text-gray-300">•</span>
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-medium">4.9 Star Rating</span>
                </div>
                <span className="text-gray-300">•</span>
                <div className="flex items-center gap-1">
                  <Search className="w-3.5 h-3.5 text-blue-600" />
                  <span className="font-medium">500M+ Searches</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Most Searched Section */}
          <MostSearched />
        </div>
      </section>

      {/* ========================================
          MOBILE STICKY CTA - TEMPORARILY DISABLED
          ======================================== */}
      {/* <div
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
      </div> */}
    </>
  );
}

"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ArrowRight,
  Sparkles,
  Menu,
  X,
  Crown,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PeopleSearch } from "@/components/shared/people-search";
import {
  ActiveProductShowcase,
  HomeOtherProductsDropdown,
  HomeTestimonials,
  HomeTrustSection,
} from "@/components/shared/home-product-showcase";
import { Logo } from "@/components/shared/logo";
import { ScrollReveal } from "@/components/shared/scroll-reveal";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { trackViewContent } from "@/lib/analytics";
import {
  getSearchExperiencePath,
  getProductThemeStyle,
  getSearchProduct,
  type SearchProductId,
} from "@/lib/search-products";
import { resolveSearchProductId } from "@/lib/search-routing";

// Lazy-load paywall modals and below-fold components to speed up initial paint
const modalLoading = () => null; // Modals render nothing when not visible
const MainPaywallModal = dynamic(() => import("@/components/shared/main-paywall-modal").then((m) => ({ default: m.MainPaywallModal })), { ssr: false, loading: modalLoading });
const ResultsPaywallModal = dynamic(() => import("@/components/shared/results-paywall-modal").then((m) => ({ default: m.ResultsPaywallModal })), { ssr: false, loading: modalLoading });
const FreeTrialPaywallModal = dynamic(() => import("@/components/shared/free-trial-paywall-modal").then((m) => ({ default: m.FreeTrialPaywallModal })), { ssr: false, loading: modalLoading });
const ScrollToTop = dynamic(() => import("@/components/shared/scroll-to-top").then((m) => ({ default: m.ScrollToTop })), { ssr: false });
const CookieConsent = dynamic(() => import("@/components/shared/cookie-consent").then((m) => ({ default: m.CookieConsent })), { ssr: false });
const SocialProofTicker = dynamic(() => import("@/components/shared/social-proof-ticker").then((m) => ({ default: m.SocialProofTicker })), { ssr: false });

function HomeContent() {
  const { user } = useAuth();
  const {
    isPro,
    showFreeTrialPaywallDirectly,
    showAbandonedPaywall,
  } = useSubscription();
  const router = useRouter();
  const searchParams = useSearchParams();
  const productParam = searchParams.get("product");
  const modeParam = searchParams.get("mode");
  const initialSelectedProduct = resolveSearchProductId(productParam) ?? "people";
  const [selectedProduct, setSelectedProduct] =
    useState<SearchProductId>(initialSelectedProduct);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isSearchMenuOpen, setIsSearchMenuOpen] = useState(false);
  const activeProduct = getSearchProduct(selectedProduct);
  const ActiveProductIcon = activeProduct.icon;
  const homeThemeStyle = getProductThemeStyle(selectedProduct);
  // TEMPORARILY DISABLED: Onboarding flow
  // const [showOnboarding, setShowOnboarding] = useState(false);
  // const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);

  // Preload paywall images early (also in layout with fetchPriority=low) - ensures they're ready when paywall opens
  useEffect(() => {
    const img1 = new window.Image();
    img1.src = '/paywall-header.png';
    const img2 = new window.Image();
    img2.src = '/paywall_image_reveal2.png';
  }, []);

  // Track landing page view
  useEffect(() => {
    // TEMPORARILY DISABLED: Onboarding check
    // if (!showOnboarding) {
      trackViewContent();
    // }
  }, []); // Removed showOnboarding dependency

  useEffect(() => {
    const nextProduct = resolveSearchProductId(productParam) ?? "people";
    setSelectedProduct((currentProduct) =>
      currentProduct === nextProduct ? currentProduct : nextProduct
    );
  }, [productParam]);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY <= 24) {
        setIsHeaderVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setIsHeaderVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setIsHeaderVisible(true);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleProductChange = (productId: SearchProductId) => {
    setSelectedProduct(productId);
    router.replace(getSearchExperiencePath(productId), { scroll: false });
  };

  const openSearchProduct = (productId: SearchProductId) => {
    setSelectedProduct(productId);
    router.replace(getSearchExperiencePath(productId), { scroll: false });
    const searchSection = document.getElementById("search");
    if (searchSection) {
      requestAnimationFrame(() => {
        searchSection.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  };

  // TEMPORARILY DISABLED: Check if user has completed onboarding
  // useEffect(() => {
  //   const hasCompletedOnboarding = localStorage.getItem("revealai_onboarding_completed");
  //   if (!hasCompletedOnboarding && !isPro) {
  //     setShowOnboarding(true);
  //   }
  //   setIsCheckingOnboarding(false);
  // }, [isPro]);


  // QA helper: open specific paywalls directly with `/?mode=abandoned` or
  // `/?mode=annual-offer` and then clean the URL so closing returns to home.
  useEffect(() => {
    if (!modeParam) return;

    if (modeParam === "abandoned") {
      showAbandonedPaywall();
      window.history.replaceState({}, "", "/");
      return;
    }

    if (modeParam === "annual-offer") {
      showFreeTrialPaywallDirectly();
      window.history.replaceState({}, "", "/");
    }
  }, [modeParam, showAbandonedPaywall, showFreeTrialPaywallDirectly]);

  // TEMPORARILY DISABLED: Handle onboarding completion
  // const handleOnboardingComplete = useCallback(() => {
  //   localStorage.setItem("revealai_onboarding_completed", "true");
  //   setShowOnboarding(false);
  //   // Show annual offer paywall after onboarding
  //   if (!isPro) {
  //     showFreeTrialPaywall();
  //   }
  // }, [isPro, showFreeTrialPaywall]);

  // TEMPORARILY DISABLED: Show loading state while checking onboarding status
  // if (isCheckingOnboarding) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center bg-background">
  //       <Loader2 className="w-8 h-8 animate-spin text-primary" />
  //     </div>
  //   );
  // }

  // TEMPORARILY DISABLED: Show onboarding flow for first-time users
  // if (showOnboarding) {
  //   return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  // }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "RevealAI",
            applicationCategory: "PeopleSearchApplication",
            operatingSystem: "Web, iOS",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: "4.9",
              ratingCount: "2500",
            },
            description:
              "Reveal AI - Safety Lookup & Privacy Toolkit. Search people, block spam calls, remove your data from brokers, find unclaimed money. Verify what's real with on-demand results from licensed providers.",
            url: "https://revealai-peoplesearch.com",
            author: {
              "@type": "Organization",
              name: "RevealAI",
            },
            featureList: [
              "People Search",
              "Dating Apps Search",
              "Followers Search",
              "Safety Lookup",
              "Reverse Phone Lookup",
              "Spam Blocker",
              "Privacy Protection",
              "Identity Check",
              "Contact Verification",
              "Remove Data from Brokers",
              "Unclaimed Money Search",
              "Dark Web Monitoring",
            ],
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "RevealAI",
            url: "https://revealai-peoplesearch.com",
            potentialAction: {
              "@type": "SearchAction",
              target: {
                "@type": "EntryPoint",
                urlTemplate: "https://revealai-peoplesearch.com/search?q={search_term_string}",
              },
              "query-input": "required name=search_term_string",
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "RevealAI",
            url: "https://revealai-peoplesearch.com",
            logo: "https://revealai-peoplesearch.com/logo.png",
            sameAs: [
              // Add your social media links here when available
              // "https://twitter.com/revealai",
              // "https://facebook.com/revealai",
              // "https://linkedin.com/company/revealai",
            ],
            contactPoint: {
              "@type": "ContactPoint",
              contactType: "Customer Service",
              availableLanguage: "English",
            },
          }),
        }}
      />
      {/* Main paywall - shown immediately when non-pro users try to search */}
      <MainPaywallModal />
      <ResultsPaywallModal />
      {/* Free trial paywall - shown when user closes abandoned paywall */}
      <FreeTrialPaywallModal />
      {/* Global UI components */}
      <ScrollToTop />
      <CookieConsent />
      <SocialProofTicker />
      <div
        className="min-h-screen relative overflow-hidden"
        style={{
          ...homeThemeStyle,
          background:
            "linear-gradient(180deg, var(--product-gradient-from) 0%, var(--product-gradient-to) 24%, var(--product-surface) 100%)",
        }}
      >
      {/* Header - Fixed on top */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 border-b border-gray-100 bg-white/95 shadow-sm backdrop-blur-sm transition-transform duration-300 ${
          isHeaderVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-center">
          <Link href="/">
            <Logo size="md" />
          </Link>
          <button
            type="button"
            onClick={() => setIsSearchMenuOpen(true)}
            aria-label="Open search menu"
            className="absolute right-4 inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {isSearchMenuOpen && (
        <div className="fixed inset-0 z-[60]">
          <button
            type="button"
            aria-label="Close search menu"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsSearchMenuOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-[360px] max-w-[92vw] border-l border-gray-200 bg-white shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-gray-100 px-4">
              <span className="text-base font-semibold text-gray-900">
                All Searches
              </span>
              <button
                type="button"
                onClick={() => setIsSearchMenuOpen(false)}
                aria-label="Close search menu"
                className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[calc(100vh-9rem)] overflow-y-auto px-3 py-4">
              <div className="space-y-2">
                {[
                  "people",
                  "social",
                  "followers",
                  "phone",
                  "records",
                  "vehicle",
                ].map((productId) => {
                  const product = getSearchProduct(productId as SearchProductId);
                  const ProductIcon = product.icon;

                  return (
                    <Link
                      key={product.id}
                      href={getSearchExperiencePath(product.id)}
                      onClick={() => {
                        setIsSearchMenuOpen(false);
                        handleProductChange(product.id);
                      }}
                      className="flex items-start gap-3 rounded-2xl border border-gray-200 px-4 py-3 transition hover:border-gray-300 hover:bg-gray-50"
                    >
                      <span
                        className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl"
                        style={{
                          backgroundColor: product.theme.soft,
                          color: product.theme.primary,
                        }}
                      >
                        <ProductIcon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-gray-900">
                          {product.menuLabel}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-gray-500">
                          {product.home.helperText}
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>

            </div>

            {isPro ? (
              <div className="absolute bottom-0 left-0 right-0 border-t border-gray-100 bg-white p-4">
                <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                  <Crown className="h-4 w-4" />
                  Pro Member
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      <main className="relative z-10 pt-16">
        {/* Hero + Search Section */}
            <PeopleSearch
              selectedProduct={selectedProduct}
              onProductChange={handleProductChange}
              initialSocialSearchMode={modeParam === "username" ? "username" : "name"}
            />
        <ActiveProductShowcase
          activeProductId={selectedProduct}
        />

        <HomeTestimonials />

        <section className="container mx-auto px-4 pb-6 flex justify-center">
          <Button
            type="button"
            size="lg"
            className="gap-2 rounded-full px-7 py-6 text-white text-lg font-semibold"
            style={{
               backgroundColor: activeProduct.theme.primary,
               boxShadow: `0 22px 44px -24px ${activeProduct.theme.shadow}`,
            }}
            onClick={() => document.getElementById("search")?.scrollIntoView({ behavior: "smooth" })}
          >
            Search Using {activeProduct.label}
            <ArrowRight className="h-5 w-5" />
          </Button>
        </section>

        <HomeOtherProductsDropdown
          onOpenProduct={openSearchProduct}
          activeProductId={selectedProduct}
        />

        <HomeTrustSection />
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            {/* Brand Column */}
            <div className="md:col-span-1">
              <Logo size="md" />
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                AI-powered people search and privacy protection trusted by millions.
              </p>
            </div>

            {/* Tools Column */}
            <div>
              <h4 className="font-semibold text-sm mb-4 text-foreground">Tools</h4>
              <ul className="space-y-2.5">
                <li><Link href={getSearchExperiencePath("people")} className="text-sm text-muted-foreground hover:text-foreground transition">People Search</Link></li>
                <li><Link href={getSearchExperiencePath("social")} className="text-sm text-muted-foreground hover:text-foreground transition">Dating Apps</Link></li>
                <li><Link href={getSearchExperiencePath("followers")} className="text-sm text-muted-foreground hover:text-foreground transition">Followers Search</Link></li>
                <li><Link href={getSearchExperiencePath("phone")} className="text-sm text-muted-foreground hover:text-foreground transition">Phone Lookup</Link></li>
                <li><Link href={getSearchExperiencePath("records")} className="text-sm text-muted-foreground hover:text-foreground transition">Public Records</Link></li>
                <li><Link href={getSearchExperiencePath("vehicle")} className="text-sm text-muted-foreground hover:text-foreground transition">Vehicle Lookup</Link></li>
                <li><Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition">Privacy Scan</Link></li>
                <li><Link href="/unclaimed" className="text-sm text-muted-foreground hover:text-foreground transition">Unclaimed Money</Link></li>
              </ul>
            </div>

            {/* Resources Column */}
            <div>
              <h4 className="font-semibold text-sm mb-4 text-foreground">Resources</h4>
              <ul className="space-y-2.5">
                <li><Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition">Blog</Link></li>
                <li><Link href="/support" className="text-sm text-muted-foreground hover:text-foreground transition">FAQ & Support</Link></li>
                <li><a href="mailto:realrevealaiofficial@gmail.com" className="text-sm text-muted-foreground hover:text-foreground transition">Contact Us</a></li>
                <li><Link href="/affiliates/login" className="text-sm text-red-600 hover:text-red-700 transition font-medium">Become an Affiliate ↗</Link></li>
              </ul>
            </div>

            {/* Legal Column */}
            <div>
              <h4 className="font-semibold text-sm mb-4 text-foreground">Legal</h4>
              <ul className="space-y-2.5">
                <li><Link href="/privacy-policy" className="text-sm text-muted-foreground hover:text-foreground transition">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition">Terms of Service</Link></li>
                <li><Link href="/settings" className="text-sm text-muted-foreground hover:text-foreground transition">Settings</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-border/50 pt-6 flex flex-col gap-4">
            <p className="text-xs text-muted-foreground text-center max-w-5xl mx-auto leading-relaxed">
              <strong>DISCLAIMER:</strong> RevealAI is not a Consumer Reporting Agency as defined by the Fair Credit Reporting Act (FCRA). The information provided by our service cannot be used to make decisions about consumer credit, employment, insurance, tenant screening, or any other purpose requiring FCRA compliance. All records are subject to availability and may not be completely accurate, up-to-date, or comprehensive.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <p className="text-xs text-muted-foreground">
                &copy; {new Date().getFullYear()} RevealAI. All rights reserved.
              </p>
              <div className="flex items-center gap-6 text-xs text-muted-foreground">
                <Link href="/privacy-policy" className="hover:text-foreground transition">Privacy</Link>
                <Link href="/terms" className="hover:text-foreground transition">Terms</Link>
                <Link href="/support" className="hover:text-foreground transition">Support</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}

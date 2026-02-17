"use client";

import Link from "next/link";
import {
  Search,
  FileText,
  AtSign,
  Car,
  Shield,
  DollarSign,
  Phone,
  ArrowRight,
  Sparkles,
  Smartphone,
  CheckCircle2,
  Zap,
  Lock,
  Users,
  TrendingUp,
  Star,
  User,
  Crown,
  ChevronDown,
  ChevronUp,
  Loader2,
  ScanSearch,
  Brain,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PeopleSearch } from "@/components/shared/people-search";
import { MainPaywallModal } from "@/components/shared/main-paywall-modal";
import { ResultsPaywallModal } from "@/components/shared/results-paywall-modal";
import { AbandonedPaywallModal } from "@/components/shared/abandoned-paywall-modal";
import { FreeTrialPaywallModal } from "@/components/shared/free-trial-paywall-modal";
// TEMPORARILY DISABLED: Onboarding flow
// import { OnboardingFlow } from "@/components/shared/onboarding-flow";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/shared/logo";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import Image from "next/image";
import { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { trackViewContent } from "@/lib/analytics";
import { ScrollToTop } from "@/components/shared/scroll-to-top";
import { CookieConsent } from "@/components/shared/cookie-consent";
import { SocialProofTicker } from "@/components/shared/social-proof-ticker";

const features = [
  { title: "People Search", description: "Full AI report on anyone: social profiles, work history, public records.", icon: Search, href: "/search", color: "text-blue-500", bgColor: "bg-blue-500/10", badge: "Popular", badgeColor: "bg-blue-500" },
  { title: "Privacy Scan", description: "Find where your data is exposed online and get removal guides.", icon: Shield, href: "/privacy", color: "text-rose-500", bgColor: "bg-rose-500/10", badge: "Urgent", badgeColor: "bg-red-500" },
  { title: "Reverse Phone Lookup", description: "Identify unknown callers: name, location, carrier, spam check.", icon: Phone, href: "/phone", color: "text-cyan-500", bgColor: "bg-cyan-500/10", badge: "New", badgeColor: "bg-cyan-600" },
  { title: "Records Search", description: "Court records, criminal history, civil cases, bankruptcies by name.", icon: FileText, href: "/records", color: "text-amber-500", bgColor: "bg-amber-500/10" },
  { title: "Username Search", description: "Find a username across 100+ social platforms and linked profiles.", icon: AtSign, href: "/username", color: "text-purple-500", bgColor: "bg-purple-500/10" },
  { title: "Vehicle Lookup", description: "Decode any VIN for specs, manufacturer, and assembly info.", icon: Car, href: "/vehicle", color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
  { title: "Unclaimed Money", description: "Search state databases for unclaimed funds owed to you.", icon: DollarSign, href: "/unclaimed", color: "text-green-500", bgColor: "bg-green-500/10", badge: "Free", badgeColor: "bg-green-600" },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 flex items-center justify-between text-left hover:bg-muted/50 transition-colors"
      >
        <span className="font-semibold text-lg pr-4">{question}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="px-6 pb-6 text-muted-foreground">{answer}</div>
      )}
    </Card>
  );
}

function HomeContent() {
  const { user } = useAuth();
  const { isPro, refreshSubscription, showAbandonedPaywall } = useSubscription();
  const searchParams = useSearchParams();
  // TEMPORARILY DISABLED: Onboarding flow
  // const [showOnboarding, setShowOnboarding] = useState(false);
  // const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);

  // Preload paywall images early so they're ready when needed
  useEffect(() => {
    // Preload images immediately on page load
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

  // TEMPORARILY DISABLED: Check if user has completed onboarding
  // useEffect(() => {
  //   const hasCompletedOnboarding = localStorage.getItem("revealai_onboarding_completed");
  //   if (!hasCompletedOnboarding && !isPro) {
  //     setShowOnboarding(true);
  //   }
  //   setIsCheckingOnboarding(false);
  // }, [isPro]);

  // Refresh subscription when returning from checkout
  useEffect(() => {
    const proParam = searchParams.get("pro");
    if (proParam === "true" && user) {
      // Refresh subscription status
      refreshSubscription();
      // Clear checkout initiated flag since checkout succeeded
      localStorage.removeItem("revealai_checkout_initiated");
      localStorage.removeItem("revealai_checkout_timestamp");
      // Clean up URL
      window.history.replaceState({}, "", "/");
    }
  }, [searchParams, user, refreshSubscription]);

  // Check for abandoned transaction (user went to Stripe and came back without completing)
  useEffect(() => {
    const canceled = searchParams.get("canceled");
    const checkoutInitiated = localStorage.getItem("revealai_checkout_initiated");
    
    // If user came back from Stripe with canceled=true and they're not Pro
    if (canceled === "true" && checkoutInitiated === "true" && !isPro) {
      // Show abandoned paywall
      showAbandonedPaywall();
      // Clear the canceled param from URL
      window.history.replaceState({}, "", "/");
    } else if (isPro && checkoutInitiated === "true") {
      // If user is now Pro, clear the flag (checkout succeeded)
      localStorage.removeItem("revealai_checkout_initiated");
      localStorage.removeItem("revealai_checkout_timestamp");
    }
  }, [searchParams, isPro, showAbandonedPaywall]);

  // TEMPORARILY DISABLED: Handle onboarding completion
  // const handleOnboardingComplete = useCallback(() => {
  //   localStorage.setItem("revealai_onboarding_completed", "true");
  //   setShowOnboarding(false);
  //   // Show free trial paywall after onboarding
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
      {/* Abandoned paywall - shown when user returns from Stripe without completing checkout */}
      <AbandonedPaywallModal />
      {/* Free trial paywall - shown when user closes abandoned paywall */}
      <FreeTrialPaywallModal />
      {/* Global UI components */}
      <ScrollToTop />
      <CookieConsent />
      <SocialProofTicker />
      <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Header - Fixed on top */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-center">
          <Link href="/">
            <Logo size="md" />
          </Link>
          {user && (
            <div className="absolute right-4 flex items-center gap-4">
              <Link href="/search" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-medium hidden sm:inline">
                  {user.email?.split("@")[0] || "Account"}
                </span>
                {isPro && (
                  <Crown className="w-4 h-4 text-amber-500" />
                )}
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className="relative z-10 pt-16">
        {/* Hero + Search Section */}
        <PeopleSearch />

        {/* Features Grid */}
        <section className="container mx-auto px-4 pt-12 pb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Powerful Tools at Your Fingertips</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to research, protect, and stay informed
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature) => (
              <Link key={feature.href} href={feature.href}>
                <Card
                  className="p-5 h-full hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 group cursor-pointer hover:-translate-y-1"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative flex-shrink-0">
                      <div
                        className={`p-3 rounded-xl ${feature.bgColor} group-hover:scale-110 transition-transform duration-300`}
                      >
                        <feature.icon className={`w-6 h-6 ${feature.color}`} />
                      </div>
                      {feature.badge && (
                        <Badge
                          className={`absolute -top-2 -right-2 ${feature.badgeColor} text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg`}
                        >
                          {feature.badge}
                        </Badge>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base group-hover:text-primary transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1 leading-snug">
                        {feature.description}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* User Reviews Section - New testimonials with photos */}
        <section className="container mx-auto px-4 pb-20">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-sm text-amber-700 mb-4">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="font-medium">4.9 out of 5 stars</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">What Our Users Say</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Thousands of people trust RevealAI for their search needs
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                name: "Robert T.",
                location: "Seattle, WA",
                image: "/reviews/review-1.png",
                content: "As a landlord, I use RevealAI to vet potential tenants. It's saved me from several bad situations. The background info is thorough and accurate.",
                rating: 5,
                useCase: "Tenant screening",
              },
              {
                name: "Jessica M.",
                location: "Austin, TX",
                image: "/reviews/review-2.png",
                content: "I was reconnecting with an old college friend and couldn't find them anywhere. RevealAI found their current info in seconds. We're meeting up next week! Totally worth it.",
                rating: 5,
                useCase: "Finding old friends",
              },
              {
                name: "Amanda K.",
                location: "Denver, CO",
                image: "/reviews/review-3.png",
                content: "Used this before a first date from a dating app. Found out the guy had a completely fake profile. Dodged a major bullet. Every single person should use this.",
                rating: 5,
                useCase: "Dating safety",
              },
            ].map((review, index) => (
              <Card 
                key={index} 
                className="p-6 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="relative w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0 ring-2 ring-white shadow-md">
                    <Image
                      src={review.image}
                      alt={review.name}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">{review.name}</span>
                      <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    </div>
                    <div className="text-sm text-gray-500">{review.location}</div>
                    <div className="flex gap-0.5 mt-1">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {review.content}
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                    {review.useCase}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* How It Works Section - Now with icons instead of numbers */}
        <section className="container mx-auto px-4 pb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get comprehensive insights in three simple steps
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                title: "Enter Your Search",
                description: "Provide a name, phone number, email, or address. Our AI-powered system accepts multiple input types.",
                icon: ScanSearch,
                color: "text-blue-600",
                bgColor: "bg-blue-100",
                borderColor: "border-blue-200",
              },
              {
                title: "AI Analyzes Data",
                description: "Our advanced algorithms search through 500M+ records across 100+ platforms in seconds.",
                icon: Brain,
                color: "text-purple-600",
                bgColor: "bg-purple-100",
                borderColor: "border-purple-200",
              },
              {
                title: "Get Results",
                description: "Receive comprehensive reports with verified information, social profiles, and public records.",
                icon: FileCheck,
                color: "text-emerald-600",
                bgColor: "bg-emerald-100",
                borderColor: "border-emerald-200",
              },
            ].map((item, index) => (
              <Card key={index} className="p-8 text-center hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
                {/* Connecting line for desktop */}
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/3 -right-4 w-8 h-0.5 bg-gradient-to-r from-gray-200 to-transparent z-10" />
                )}
                <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl ${item.bgColor} ${item.borderColor} border-2 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                  <item.icon className={`w-10 h-10 ${item.color}`} strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="container mx-auto px-4 pb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Why Choose RevealAI?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The most trusted platform for people intelligence
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Lock,
                title: "Secure & Private",
                description: "Your searches are encrypted and never shared. We prioritize your privacy above all.",
                color: "text-blue-500",
                bgColor: "bg-blue-500/10",
              },
              {
                icon: Zap,
                title: "Lightning Fast",
                description: "Get results in seconds, not hours. Our AI-powered search is optimized for speed.",
                color: "text-amber-500",
                bgColor: "bg-amber-500/10",
              },
              {
                icon: CheckCircle2,
                title: "Verified Data",
                description: "All information is cross-referenced and verified from official sources.",
                color: "text-emerald-500",
                bgColor: "bg-emerald-500/10",
              },
              {
                icon: Users,
                title: "Trusted by Millions",
                description: "Join over 2 million users who trust RevealAI for their research needs.",
                color: "text-purple-500",
                bgColor: "bg-purple-500/10",
              },
              {
                icon: TrendingUp,
                title: "Always Updated",
                description: "Our database is updated in real-time with the latest public records and information.",
                color: "text-rose-500",
                bgColor: "bg-rose-500/10",
              },
              {
                icon: Shield,
                title: "Data Protection",
                description: "Remove your personal information from data brokers and protect your privacy.",
                color: "text-red-500",
                bgColor: "bg-red-500/10",
              },
            ].map((feature, index) => (
              <Card key={index} className="p-6 hover:border-primary/50 transition-all">
                <div className={`w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center mb-4`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </Card>
            ))}
          </div>
        </section>


        {/* FAQ Section */}
        <section className="container mx-auto px-4 pb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about RevealAI
            </p>
          </div>
          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                question: "How accurate is the information provided?",
                answer: "All information is sourced from verified public records, official databases, and legitimate sources. We cross-reference multiple data points to ensure accuracy and reliability.",
              },
              {
                question: "Is my search history private?",
                answer: "Yes, absolutely. We use end-to-end encryption and never share your search history with third parties. Your privacy is our top priority.",
              },
              {
                question: "What types of records can I search?",
                answer: "You can search court records, criminal history, social media profiles, vehicle information, property records, and more across 100+ platforms and databases.",
              },
              {
                question: "How do I remove my information from data brokers?",
                answer: "Our privacy removal service helps you identify which data brokers have your information and guides you through the removal process. We handle the paperwork and follow-ups for you.",
              },
              {
                question: "Do you offer a free trial?",
                answer: "Yes! New users get free access to try our basic search features. Upgrade to Pro for unlimited searches and advanced features.",
              },
            ].map((faq, index) => (
              <FAQItem key={index} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="container mx-auto px-4 pb-20">
          <Card className="p-10 md:p-16 text-center relative overflow-hidden border-0 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-red-500 to-rose-600" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 text-sm text-white/90 font-medium mb-6 backdrop-blur-sm">
                <Sparkles className="w-4 h-4" />
                Trusted by 2M+ users
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">
                Know More. Stay Safe.
              </h2>
              <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto">
                Get instant access to AI-powered people search, privacy protection, background checks, and more.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                {!user && (
                  <>
                    <Link href="/login?signup=true" className="flex-1">
                      <Button size="lg" className="w-full text-base bg-white text-red-600 hover:bg-white/90 font-bold shadow-lg">
                        Get Started Free
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                    <Link href="/login" className="flex-1">
                      <Button size="lg" variant="outline" className="w-full text-base border-white/30 text-white hover:bg-white/10 font-medium">
                        Sign In
                      </Button>
                    </Link>
                  </>
                )}
                {user && (
                  <Link href="/search">
                    <Button size="lg" className="gap-2 text-base bg-white text-red-600 hover:bg-white/90 font-bold shadow-lg px-8">
                      <Search className="w-5 h-5" />
                      Start Searching Now
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                )}
              </div>
              <p className="text-xs text-white/50 mt-6">
                No credit card required to start. Cancel anytime.
              </p>
            </div>
          </Card>
        </section>
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
                <li><Link href="/search" className="text-sm text-muted-foreground hover:text-foreground transition">People Search</Link></li>
                <li><Link href="/phone" className="text-sm text-muted-foreground hover:text-foreground transition">Phone Lookup</Link></li>
                <li><Link href="/records" className="text-sm text-muted-foreground hover:text-foreground transition">Records Search</Link></li>
                <li><Link href="/username" className="text-sm text-muted-foreground hover:text-foreground transition">Username Search</Link></li>
                <li><Link href="/vehicle" className="text-sm text-muted-foreground hover:text-foreground transition">Vehicle Lookup</Link></li>
                <li><Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition">Privacy Scan</Link></li>
              </ul>
            </div>

            {/* Resources Column */}
            <div>
              <h4 className="font-semibold text-sm mb-4 text-foreground">Resources</h4>
              <ul className="space-y-2.5">
                <li><Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition">Blog</Link></li>
                <li><a href="https://polished-factory-180.notion.site/Reveal-AI-People-Search-279df7bf5f6a80559673d41efdd0a82e" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition">FAQ</a></li>
                <li><a href="https://polished-factory-180.notion.site/Support-278df7bf5f6a80e5986bc22ac7786ced" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition">Support</a></li>
                <li><a href="https://polished-factory-180.notion.site/Feedback-Suggestions-279df7bf5f6a8090b058f19161d822ca" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition">Feedback</a></li>
              </ul>
            </div>

            {/* Legal Column */}
            <div>
              <h4 className="font-semibold text-sm mb-4 text-foreground">Legal</h4>
              <ul className="space-y-2.5">
                <li><a href="https://polished-factory-180.notion.site/Privacy-Policy-278df7bf5f6a801bb270d8216c5182c9" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition">Privacy Policy</a></li>
                <li><a href="https://polished-factory-180.notion.site/Terms-of-Service-279df7bf5f6a8064bad7c5481a8e9a1b" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition">Terms of Service</a></li>
                <li><Link href="/settings" className="text-sm text-muted-foreground hover:text-foreground transition">Settings</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-border/50 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} RevealAI. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <a href="https://polished-factory-180.notion.site/Privacy-Policy-278df7bf5f6a801bb270d8216c5182c9" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition">Privacy</a>
              <a href="https://polished-factory-180.notion.site/Terms-of-Service-279df7bf5f6a8064bad7c5481a8e9a1b" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition">Terms</a>
              <a href="https://polished-factory-180.notion.site/Support-278df7bf5f6a80e5986bc22ac7786ced" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition">Support</a>
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


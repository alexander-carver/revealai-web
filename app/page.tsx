"use client";

import Link from "next/link";
import {
  Search,
  FileText,
  AtSign,
  Car,
  Shield,
  DollarSign,
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PeopleSearch } from "@/components/shared/people-search";
import { FreeTrialPaywallModal } from "@/components/shared/free-trial-paywall-modal";
import { ResultsPaywallModal } from "@/components/shared/results-paywall-modal";
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

const features = [
  {
    title: "Remove YOUR sensitive Info",
    description: "Remove your data from brokers and check exposure",
    icon: Shield,
    href: "/privacy",
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
    badge: "Urgent",
    badgeColor: "bg-red-500",
  },
  {
    title: "Unclaimed Money",
    description: "Find money owed to you by state governments",
    icon: DollarSign,
    href: "/unclaimed",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    badge: "try",
    badgeColor: "bg-red-500",
  },
  {
    title: "People Search",
    description: "Find anyone using name, phone, email, or address",
    icon: Search,
    href: "/search",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    title: "Records Search",
    description: "Court records, criminal history, and public filings",
    icon: FileText,
    href: "/records",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    title: "Username Search",
    description: "Find social profiles across 100+ platforms",
    icon: AtSign,
    href: "/username",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    title: "Vehicle Lookup",
    description: "Decode any VIN for vehicle history and specs",
    icon: Car,
    href: "/vehicle",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
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
  const { isPro, refreshSubscription } = useSubscription();
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
      // Clean up URL
      window.history.replaceState({}, "", "/");
    }
  }, [searchParams, user, refreshSubscription]);

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
      {/* Free trial paywall - shown immediately when non-pro users try to search */}
      <FreeTrialPaywallModal />
      <ResultsPaywallModal />
      <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Header - Fixed on top */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-center">
          <Link href="/">
            <Logo size="md" />
          </Link>
          {user && (
            <div className="absolute right-4 flex items-center gap-4">
              <Link href="/settings" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors">
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
              <Link href="/search">
                <Button size="sm">Go to App</Button>
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className="relative z-10 pt-16">
        {/* Hero + Search Section */}
        <PeopleSearch />

        {/* Features Grid */}
        <section className="container mx-auto px-4 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Link key={feature.href} href={feature.href}>
                <Card
                  className="p-6 h-full hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 group cursor-pointer"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <div
                        className={`p-3 rounded-xl ${feature.bgColor} group-hover:scale-110 transition-transform`}
                      >
                        <feature.icon className={`w-6 h-6 ${feature.color}`} />
                      </div>
                      {feature.badge && (
                        <Badge
                          className={`absolute -top-2 -right-2 ${feature.badgeColor} text-white text-xs font-bold px-1.5 py-0.5 rounded-full shadow-lg`}
                        >
                          {feature.badge}
                        </Badge>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {feature.description}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Stats Section */}
        <section className="container mx-auto px-4 pb-20">
          <Card className="p-8 glass">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { value: "500M+", label: "Records Indexed" },
                { value: "100+", label: "Platforms Searched" },
                { value: "99.9%", label: "Uptime" },
                { value: "24/7", label: "Support" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-3xl font-bold gradient-text">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* How It Works Section */}
        <section className="container mx-auto px-4 pb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get comprehensive insights in three simple steps
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: "1",
                title: "Enter Your Search",
                description: "Provide a name, phone number, email, or address. Our AI-powered system accepts multiple input types.",
                icon: Search,
              },
              {
                step: "2",
                title: "AI Analyzes Data",
                description: "Our advanced algorithms search through 500M+ records across 100+ platforms in seconds.",
                icon: Zap,
              },
              {
                step: "3",
                title: "Get Results",
                description: "Receive comprehensive reports with verified information, social profiles, and public records.",
                icon: CheckCircle2,
              },
            ].map((item, index) => (
              <Card key={index} className="p-8 text-center hover:border-primary/50 transition-all">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <div className="text-2xl font-bold text-primary">{item.step}</div>
                </div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
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

        {/* Testimonials Section */}
        <section className="container mx-auto px-4 pb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Trusted by Thousands</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              See what our users are saying
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                name: "Sarah Johnson",
                role: "Private Investigator",
                content: "RevealAI has revolutionized my workflow. I can find information in minutes that used to take hours.",
                rating: 5,
              },
              {
                name: "Michael Chen",
                role: "HR Professional",
                content: "The background check feature is incredibly thorough. It's become essential for our hiring process.",
                rating: 5,
              },
              {
                name: "Emily Rodriguez",
                role: "Journalist",
                content: "As a journalist, I need reliable sources. RevealAI provides accurate, verified information every time.",
                rating: 5,
              },
            ].map((testimonial, index) => (
              <Card key={index} className="p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4 italic">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Mobile App Download Section */}
        <section id="download-app" className="container mx-auto px-4 pb-20">
          <Card className="p-12 glass overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/10" />
            <div className="relative grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary mb-6">
                  <Smartphone className="w-4 h-4" />
                  <span>Available Now</span>
                </div>
                <h2 className="text-4xl font-bold mb-4">
                  Take RevealAI <span className="gradient-text">On The Go</span>
                </h2>
                <p className="text-xl text-muted-foreground mb-8">
                  Search, research, and protect your privacy from anywhere. Our mobile app brings the full power of RevealAI to your fingertips.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <a 
                    href="https://apps.apple.com/us/app/reveal-ai-people-search/id6752310763"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
                  >
                      <Image
                        src="/logo.png"
                        alt="App Store"
                        width={24}
                        height={24}
                        className="object-contain"
                      />
                      Download for iOS
                    </a>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="relative w-64 h-96">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-3xl blur-3xl" />
                  <div className="relative w-full h-full bg-card border-2 border-border rounded-3xl p-8 flex items-center justify-center">
                    <Smartphone className="w-32 h-32 text-primary/50" />
                  </div>
                </div>
              </div>
            </div>
          </Card>
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
          <Card className="p-12 text-center glass relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/10" />
            <div className="relative">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Ready to <span className="gradient-text">Get Started?</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join millions of users who trust RevealAI for accurate, comprehensive people intelligence.
              </p>
              <div className="flex flex-col gap-4 justify-center max-w-md mx-auto">
                {!user && (
                  <>
                    <Link href="/login?signup=true">
                      <Button size="lg" className="w-full text-base">
                        Sign Up
                      </Button>
                    </Link>
                    <Link href="/login">
                      <Button size="lg" variant="outline" className="w-full text-base">
                        Sign In
                      </Button>
                    </Link>
                  </>
                )}
                {user && (
                  <Link href="/search">
                    <Button size="lg" className="gap-2 text-base w-full">
                      <Search className="w-5 h-5" />
                      Start Searching Now
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} RevealAI. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-4">
            <Link href="/privacy" className="hover:text-foreground transition">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition">
              Terms of Service
            </Link>
            <Link href="/settings" className="hover:text-foreground transition">
              Settings
            </Link>
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


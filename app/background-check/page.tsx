import type { Metadata } from "next";
import Link from "next/link";
import { Search, FileText, Shield, Brain, ArrowRight, Star, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/shared/logo";

export const metadata: Metadata = {
  title: "Background Check Online - Public Records Search | RevealAI",
  description:
    "Run instant background checks online. Search criminal records, court filings, address history, and more with AI-powered people search.",
  keywords: [
    "background check",
    "background check online",
    "criminal background check",
    "public records search",
    "court records search",
    "people background check",
    "free background check",
    "criminal records",
  ],
  alternates: {
    canonical: "https://revealai-peoplesearch.com/background-check",
  },
};

export default function BackgroundCheckLanding() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 bg-white/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-center">
          <Link href="/">
            <Logo size="md" />
          </Link>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="py-20 md:py-28 bg-gradient-to-b from-blue-50 to-white">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6">
              <FileText className="w-4 h-4" />
              Background Check
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Instant <span className="text-blue-600">Background Checks</span> Online
            </h1>
            <p className="text-xl text-gray-500 mb-8 max-w-2xl mx-auto">
              Search criminal records, court filings, address history, and public records on anyone. AI-powered, comprehensive, and fast.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/search">
                <Button size="lg" className="gap-2 bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6 rounded-full shadow-lg shadow-blue-600/25 w-full sm:w-auto">
                  <Search className="w-5 h-5" />
                  Run a People Search
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/records">
                <Button size="lg" variant="outline" className="gap-2 text-lg px-8 py-6 rounded-full w-full sm:w-auto">
                  <FileText className="w-5 h-5" />
                  Search Court Records
                </Button>
              </Link>
            </div>
            <div className="flex items-center justify-center gap-4 mt-6 text-sm text-gray-400">
              <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-amber-400 text-amber-400" /> 4.9 Rating</span>
              <span>•</span>
              <span>500M+ Records</span>
              <span>•</span>
              <span>Trusted by Millions</span>
            </div>
          </div>
        </section>

        {/* What's included */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-3xl font-bold text-center mb-12">What&apos;s Included</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: "Criminal Records", desc: "Felonies, misdemeanors, and arrest records from federal and state databases." },
                { title: "Court Records", desc: "Civil cases, bankruptcy filings, liens, and judgments." },
                { title: "Address History", desc: "Current and previous addresses, including associated residents." },
                { title: "Social Profiles", desc: "Social media accounts and online presence across 100+ platforms." },
                { title: "Employment Info", desc: "Professional background and publicly available work history." },
                { title: "AI Analysis", desc: "AI-compiled comprehensive report with cross-referenced data." },
              ].map((item, i) => (
                <Card key={i} className="p-5">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-1">{item.title}</h3>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4 text-center max-w-2xl">
            <Brain className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">AI-Powered Background Intelligence</h2>
            <p className="text-lg text-gray-500 mb-8">
              Get comprehensive background reports in seconds, not days.
            </p>
            <Link href="/search">
              <Button size="lg" className="gap-2 bg-red-600 hover:bg-red-700 text-lg px-8 py-6 rounded-full">
                Start Searching Now
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} RevealAI. All rights reserved.</p>
          <div className="flex justify-center gap-4 mt-3">
            <Link href="/" className="hover:text-gray-600">Home</Link>
            <Link href="/blog" className="hover:text-gray-600">Blog</Link>
            <Link href="/privacy" className="hover:text-gray-600">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

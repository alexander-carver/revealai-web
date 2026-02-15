import type { Metadata } from "next";
import Link from "next/link";
import { Heart, AlertTriangle, Shield, Search, ArrowRight, Star, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/shared/logo";

export const metadata: Metadata = {
  title: "Dating App Profile Search - Find Hidden Profiles | RevealAI",
  description:
    "Find hidden dating app profiles on Tinder, Bumble, Hinge, Match, and more. Search for someone's dating profiles and protect yourself from catfishing.",
  keywords: [
    "dating app search",
    "find dating profiles",
    "is my partner on tinder",
    "tinder search",
    "bumble search",
    "hinge search",
    "catfish checker",
    "dating app checker",
    "find hidden dating profiles",
    "is he on dating apps",
  ],
  alternates: {
    canonical: "https://revealai-peoplesearch.com/dating-app-search",
  },
};

export default function DatingAppSearchLanding() {
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
        <section className="py-20 md:py-28 bg-gradient-to-b from-red-50 to-white">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-100 text-red-700 text-sm font-medium mb-6">
              <AlertTriangle className="w-4 h-4" />
              Dating Safety Tool
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Find Hidden <span className="text-red-600">Dating App</span> Profiles
            </h1>
            <p className="text-xl text-gray-500 mb-8 max-w-2xl mx-auto">
              Search Tinder, Bumble, Hinge, Match, Grindr, and more. Protect yourself from catfishing and verify who you&apos;re really talking to.
            </p>
            <Link href="/">
              <Button size="lg" className="gap-2 bg-red-600 hover:bg-red-700 text-lg px-8 py-6 rounded-full shadow-lg shadow-red-600/25">
                <Search className="w-5 h-5" />
                Search Dating Profiles
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center justify-center gap-4 mt-6 text-sm text-gray-400">
              <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-amber-400 text-amber-400" /> 4.9 Rating</span>
              <span>•</span>
              <span>100+ Platforms</span>
              <span>•</span>
              <span>Instant Results</span>
            </div>
          </div>
        </section>

        {/* Supported Platforms */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h2 className="text-3xl font-bold mb-4">Platforms We Search</h2>
            <p className="text-gray-500 mb-10">We search across all major dating apps and platforms</p>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                "Tinder", "Bumble", "Hinge", "Match.com", "eHarmony",
                "OkCupid", "Plenty of Fish", "Grindr", "Coffee Meets Bagel",
                "Zoosk", "Facebook Dating", "Happn",
              ].map((platform) => (
                <Badge key={platform} variant="secondary" className="text-sm py-2 px-4">
                  {platform}
                </Badge>
              ))}
              <Badge variant="outline" className="text-sm py-2 px-4">+90 more</Badge>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-3xl font-bold text-center mb-12">Why People Search Dating Profiles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: Shield,
                  title: "Pre-Date Safety",
                  desc: "Verify someone's identity before meeting them in person. Check for red flags.",
                  color: "text-blue-600",
                  bg: "bg-blue-50",
                },
                {
                  icon: Eye,
                  title: "Trust Verification",
                  desc: "Find out if your partner has active dating profiles they haven't told you about.",
                  color: "text-red-600",
                  bg: "bg-red-50",
                },
                {
                  icon: AlertTriangle,
                  title: "Catfish Detection",
                  desc: "Confirm the person you're talking to is who they claim to be.",
                  color: "text-amber-600",
                  bg: "bg-amber-50",
                },
              ].map((item, i) => (
                <Card key={i} className="p-6 text-center">
                  <div className={`w-14 h-14 mx-auto rounded-2xl ${item.bg} flex items-center justify-center mb-4`}>
                    <item.icon className={`w-7 h-7 ${item.color}`} />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-gray-500 text-sm">{item.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="container mx-auto px-4 text-center max-w-2xl">
            <Heart className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Protect Yourself Before Swiping Right</h2>
            <p className="text-lg text-gray-500 mb-8">
              A quick search could save you from heartbreak — or worse.
            </p>
            <Link href="/">
              <Button size="lg" className="gap-2 bg-red-600 hover:bg-red-700 text-lg px-8 py-6 rounded-full">
                Search Now
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

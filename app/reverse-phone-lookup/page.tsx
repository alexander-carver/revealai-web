import type { Metadata } from "next";
import Link from "next/link";
import { Phone, Shield, Zap, Users, ArrowRight, CheckCircle2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/shared/logo";

export const metadata: Metadata = {
  title: "Reverse Phone Lookup - Find Who Called You | RevealAI",
  description:
    "Free reverse phone lookup. Instantly identify unknown callers, spam numbers, and scam calls. Find the owner of any phone number with AI-powered search.",
  keywords: [
    "reverse phone lookup",
    "reverse phone lookup free",
    "who called me",
    "phone number lookup",
    "caller ID lookup",
    "spam caller lookup",
    "who is calling me",
    "phone number search",
  ],
  alternates: {
    canonical: "https://revealai-peoplesearch.com/reverse-phone-lookup",
  },
};

export default function ReversePhoneLookupLanding() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-center">
          <Link href="/">
            <Logo size="md" />
          </Link>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="py-20 md:py-28 bg-gradient-to-b from-cyan-50 to-white">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-100 text-cyan-700 text-sm font-medium mb-6">
              <Phone className="w-4 h-4" />
              Reverse Phone Lookup
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Find Out Who&apos;s <span className="text-cyan-600">Calling You</span>
            </h1>
            <p className="text-xl text-gray-500 mb-8 max-w-2xl mx-auto">
              Instantly identify unknown callers, block spam numbers, and protect yourself from phone scams with AI-powered reverse phone lookup.
            </p>
            <Link href="/phone">
              <Button size="lg" className="gap-2 bg-cyan-600 hover:bg-cyan-700 text-lg px-8 py-6 rounded-full shadow-lg shadow-cyan-600/25">
                <Phone className="w-5 h-5" />
                Lookup a Number Now
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center justify-center gap-4 mt-6 text-sm text-gray-400">
              <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-amber-400 text-amber-400" /> 4.9 Rating</span>
              <span>•</span>
              <span>500M+ Records</span>
              <span>•</span>
              <span>Instant Results</span>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-3xl font-bold text-center mb-12">What You&apos;ll Find</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: Users, title: "Owner Information", desc: "Full name, location, and associated addresses of the phone owner." },
                { icon: Shield, title: "Spam & Scam Check", desc: "Instantly know if a number has been reported as spam or scam." },
                { icon: Zap, title: "Carrier Details", desc: "Phone type (mobile/landline), carrier name, and registration info." },
              ].map((f, i) => (
                <Card key={i} className="p-6 text-center">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-cyan-50 flex items-center justify-center mb-4">
                    <f.icon className="w-7 h-7 text-cyan-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                  <p className="text-gray-500 text-sm">{f.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <h2 className="text-3xl font-bold mb-12">How It Works</h2>
            <div className="space-y-6">
              {[
                "Enter the phone number you want to look up",
                "Our AI searches 500M+ records across multiple databases",
                "Get a detailed report with owner info, spam status, and more",
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-4 text-left">
                  <div className="w-10 h-10 rounded-full bg-cyan-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                    {i + 1}
                  </div>
                  <p className="text-lg text-gray-700">{step}</p>
                </div>
              ))}
            </div>
            <Link href="/phone" className="inline-block mt-10">
              <Button size="lg" className="gap-2 bg-cyan-600 hover:bg-cyan-700">
                Try It Free
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="container mx-auto px-4 text-center max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Stop Unknown Callers</h2>
            <p className="text-lg text-gray-500 mb-8">
              Join millions of users who trust RevealAI to identify callers and stay safe.
            </p>
            <Link href="/phone">
              <Button size="lg" className="gap-2 bg-red-600 hover:bg-red-700 text-lg px-8 py-6 rounded-full">
                Start Your Lookup
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

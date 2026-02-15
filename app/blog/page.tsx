"use client";

import Link from "next/link";
import {
  BookOpen,
  ArrowRight,
  Clock,
  Calendar,
  Shield,
  Home,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { blogPosts, getCategoryColor } from "@/lib/blog-data";
import { ScrollToTop } from "@/components/shared/scroll-to-top";

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <Logo size="md" />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <Home className="w-4 h-4" />
                Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 text-sm mb-4">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="font-medium">RevealAI Blog</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Privacy Tips, Safety Guides & More
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Expert advice on protecting your privacy, staying safe online, and getting the most out of people search tools.
          </p>
        </div>

        {/* Posts Grid */}
        <div className="space-y-4">
          {blogPosts.map((post, index) => {
            const colors = getCategoryColor(post.category);
            return (
              <Link key={post.slug} href={`/blog/${post.slug}`}>
                <Card className="hover:border-primary/30 hover:shadow-md transition-all duration-200 group cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={`${colors.bg} ${colors.text} border-0 text-xs`}>
                            {post.category}
                          </Badge>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {post.readTime}
                          </span>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 group-hover:text-primary transition-colors mb-2">
                          {post.title}
                        </h2>
                        <p className="text-gray-500 text-sm leading-relaxed">
                          {post.description}
                        </p>
                        <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
                          <Calendar className="w-3 h-3" />
                          {new Date(post.publishedAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0 mt-2 hidden md:block" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* CTA */}
        <Card className="mt-12 bg-gradient-to-br from-gray-900 to-gray-800 text-white border-0">
          <CardContent className="p-8 text-center">
            <Shield className="w-10 h-10 mx-auto mb-4 text-red-400" />
            <h2 className="text-2xl font-bold mb-2">Check Your Privacy Score</h2>
            <p className="text-gray-300 mb-6 max-w-md mx-auto">
              Find out how exposed your personal information is online. Free privacy scan available.
            </p>
            <Link href="/privacy">
              <Button className="bg-red-600 hover:bg-red-700 gap-2">
                Check Now
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} RevealAI. All rights reserved.</p>
        </div>
      </footer>

      <ScrollToTop />
    </div>
  );
}

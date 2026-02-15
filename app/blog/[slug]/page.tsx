"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Calendar,
  Share2,
  Home,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { getBlogPost, blogPosts, getCategoryColor } from "@/lib/blog-data";
import { ScrollToTop } from "@/components/shared/scroll-to-top";

export default function BlogPostPage() {
  const params = useParams();
  const post = getBlogPost(params.slug as string);

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Post Not Found</h1>
          <Link href="/blog">
            <Button>Back to Blog</Button>
          </Link>
        </div>
      </div>
    );
  }

  const colors = getCategoryColor(post.category);

  // Get related posts (same category, excluding current)
  const relatedPosts = blogPosts
    .filter((p) => p.slug !== post.slug)
    .slice(0, 3);

  // Simple markdown-to-HTML renderer
  const renderContent = (content: string) => {
    return content
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold text-gray-900 mt-8 mb-3">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold text-gray-900 mt-6 mb-2">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-red-600 hover:underline">$1</a>')
      .replace(/^- (.*$)/gim, '<li class="ml-4 text-gray-600 mb-1">• $1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 text-gray-600 mb-1">$1</li>')
      .replace(/\n\n/g, '</p><p class="text-gray-600 leading-relaxed mb-4">')
      .replace(/\n/g, "<br/>");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <Logo size="md" />
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/blog">
              <Button variant="ghost" size="sm" className="gap-2">
                <BookOpen className="w-4 h-4" />
                Blog
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <Home className="w-4 h-4" />
                Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Back Link */}
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </Link>

        {/* Article Header */}
        <article>
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Badge className={`${colors.bg} ${colors.text} border-0`}>
                {post.category}
              </Badge>
              <span className="text-sm text-gray-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {post.readTime}
              </span>
              <span className="text-sm text-gray-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(post.publishedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-4">
              {post.title}
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed">
              {post.description}
            </p>
          </div>

          {/* Share Button */}
          <div className="flex items-center gap-2 mb-8 pb-8 border-b border-gray-200">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: post.title,
                    text: post.description,
                    url: window.location.href,
                  });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                }
              }}
            >
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>

          {/* Article Content */}
          <div
            className="prose prose-gray max-w-none"
            dangerouslySetInnerHTML={{
              __html: `<p class="text-gray-600 leading-relaxed mb-4">${renderContent(
                post.content.trim()
              )}</p>`,
            }}
          />
        </article>

        {/* Related Posts */}
        <div className="mt-16 pt-8 border-t border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">More Articles</h2>
          <div className="space-y-3">
            {relatedPosts.map((related) => {
              const relColors = getCategoryColor(related.category);
              return (
                <Link key={related.slug} href={`/blog/${related.slug}`}>
                  <Card className="hover:border-primary/30 transition-all group cursor-pointer">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`${relColors.bg} ${relColors.text} border-0 text-[10px]`}>
                            {related.category}
                          </Badge>
                          <span className="text-[10px] text-gray-400">{related.readTime}</span>
                        </div>
                        <h3 className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
                          {related.title}
                        </h3>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary flex-shrink-0" />
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <Card className="mt-12 bg-gradient-to-br from-red-600 to-red-700 text-white border-0">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Ready to Search?</h2>
            <p className="text-red-100 mb-6">
              Try RevealAI&apos;s people search, privacy tools, and more.
            </p>
            <Link href="/">
              <Button className="bg-white text-red-600 hover:bg-gray-100 gap-2">
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>

      <footer className="border-t border-gray-200 py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} RevealAI. All rights reserved.</p>
        </div>
      </footer>

      <ScrollToTop />
    </div>
  );
}

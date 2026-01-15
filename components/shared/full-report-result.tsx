"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ExternalLink, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  FileText,
  ChevronDown,
  ChevronUp,
  Search,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  Copy,
} from "lucide-react";
import Image from "next/image";

interface FullReportResultProps {
  content: string;
  onFollowUpSearch?: (query: string) => void;
  searchCount: number;
  personName?: string;
}

interface ParsedReport {
  images: Array<{ url: string; attribution: string }>;
  sources: Array<{ label: string; url: string }>;
  answer: string;
}

function parseReport(content: string): ParsedReport {
  const images: Array<{ url: string; attribution: string }> = [];
  const sources: Array<{ label: string; url: string }> = [];
  let answer = "";

  // Split content into sections
  const sections = content.split(/\n(?=#{1,3}\s)/);
  
  for (const section of sections) {
    const trimmed = section.trim();
    
    // Parse Images section
    if (trimmed.match(/^#{1,3}\s*Images?/i)) {
      const lines = trimmed.split("\n").slice(1); // Skip header
      for (const line of lines) {
        const match = line.match(/(.+?)\s*\|\s*(.+)/);
        if (match) {
          const url = match[1].trim();
          const attribution = match[2].trim();
          if (url.startsWith("http")) {
            images.push({ url, attribution });
          }
        }
      }
    }
    
    // Parse Sources section
    else if (trimmed.match(/^#{1,3}\s*Sources?/i)) {
      const lines = trimmed.split("\n").slice(1); // Skip header
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      for (const line of lines) {
        // Match markdown links [label](url) using exec for compatibility
        let match;
        while ((match = linkRegex.exec(line)) !== null) {
          sources.push({ label: match[1], url: match[2] });
        }
      }
    }
    
    // Parse Answer section
    else if (trimmed.match(/^#{1,3}\s*Answer/i)) {
      answer = trimmed.split("\n").slice(1).join("\n").trim();
    }
  }

  // If no structured sections found, treat entire content as answer
  if (!images.length && !sources.length && !answer) {
    answer = content;
  }

  return { images, sources, answer };
}

export function FullReportResult({ content, onFollowUpSearch, searchCount, personName }: FullReportResultProps) {
  const [showAllImages, setShowAllImages] = useState(false);
  const [showAllSources, setShowAllSources] = useState(false);
  const [followUpQuery, setFollowUpQuery] = useState("");
  
  const report = parseReport(content);
  const displayImages = showAllImages ? report.images : report.images.slice(0, 6);
  const displaySources = showAllSources ? report.sources : report.sources.slice(0, 12);

  // Generate open-ended follow-up questions based on person name
  const name = personName || "this person";
  const followUpSuggestions = [
    `What professional experience does ${name} have?`,
    `What investments or business ventures is ${name} involved in?`,
    `What education background does ${name} have?`,
    `What controversies or legal issues involve ${name}?`,
    `What social media presence does ${name} have?`,
  ];

  const handleFollowUpSubmit = () => {
    if (followUpQuery.trim() && onFollowUpSearch) {
      onFollowUpSearch(followUpQuery);
      setFollowUpQuery("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback Buttons at Top */}
      <div className="flex items-center gap-2 justify-end">
        <Button
          variant="ghost"
          size="icon"
          className="w-10 h-10 rounded-full hover:bg-muted"
          title="This was helpful"
        >
          <ThumbsUp className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="w-10 h-10 rounded-full hover:bg-muted"
          title="This wasn't helpful"
        >
          <ThumbsDown className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="w-10 h-10 rounded-full hover:bg-muted"
          title="Copy report"
          onClick={() => navigator.clipboard.writeText(content)}
        >
          <Copy className="w-5 h-5" />
        </Button>
      </div>

      {/* Images Section */}
      {report.images.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ImageIcon className="w-5 h-5 text-primary" />
              Images ({report.images.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {displayImages.map((img, index) => (
                <div key={index} className="relative group">
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                    <Image
                      src={img.url}
                      alt={img.attribution}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 33vw"
                      onError={(e) => {
                        // Hide image if it fails to load
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground line-clamp-2">
                    {img.attribution}
                  </div>
                  <a
                    href={img.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
            {report.images.length > 6 && (
              <Button
                variant="outline"
                onClick={() => setShowAllImages(!showAllImages)}
                className="w-full mt-4"
              >
                {showAllImages ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Show All {report.images.length} Images
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sources Section */}
      {report.sources.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <LinkIcon className="w-5 h-5 text-primary" />
              Sources ({report.sources.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {displaySources.map((source, index) => (
                <a
                  key={index}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
                >
                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary flex-shrink-0" />
                  <span className="text-sm truncate">{source.label}</span>
                </a>
              ))}
            </div>
            {report.sources.length > 12 && (
              <Button
                variant="outline"
                onClick={() => setShowAllSources(!showAllSources)}
                className="w-full mt-4"
              >
                {showAllSources ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Show All {report.sources.length} Sources
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Answer Section */}
      {report.answer && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-primary" />
              Full Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <div
                dangerouslySetInnerHTML={{
                  __html: report.answer
                    .replace(/\n/g, "<br/>")
                    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>'),
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Related Questions Section */}
      {onFollowUpSearch && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Search className="w-5 h-5" />
              Related
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Recommended Follow-up Questions */}
            <div className="space-y-3">
              {followUpSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => onFollowUpSearch && onFollowUpSearch(suggestion)}
                  className="w-full flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group text-left"
                >
                  <span className="text-sm font-medium">{suggestion}</span>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary flex-shrink-0 ml-4" />
                </button>
              ))}
            </div>

            {/* Open-ended Search Input */}
            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 mb-3">
                <Search className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Ask follow up</span>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Ask anything about this person..."
                  value={followUpQuery}
                  onChange={(e) => setFollowUpQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleFollowUpSubmit()}
                  className="flex-1"
                />
                <Button
                  onClick={handleFollowUpSubmit}
                  disabled={!followUpQuery.trim()}
                  size="icon"
                  className="bg-red-600 hover:bg-red-700"
                >
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pro searches exhausted notice */}
      {searchCount >= 3 && (
        <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent">
          <CardContent className="p-4">
            <Badge className="bg-amber-500 text-white mb-2">
              Pro Searches Used
            </Badge>
            <p className="text-sm text-muted-foreground">
              You've used all 3 Pro searches. Additional searches will use standard search.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


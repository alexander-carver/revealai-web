"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { mockProfiles, type MockProfile } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  User,
  Globe,
  Share2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Twitter,
  Facebook,
  Instagram,
  Youtube,
  CheckCircle2,
  AlertTriangle,
  Building,
  FileText,
  GraduationCap,
  Scale,
  Newspaper,
  Database,
  Crown,
  Search,
  Lock,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSubscription } from "@/hooks/use-subscription";
import { SearchLoadingScreen } from "@/components/shared/search-loading-screen";
import { ResultsPaywallModal } from "@/components/shared/results-paywall-modal";
import { MainPaywallModal } from "@/components/shared/main-paywall-modal";

// Get icon for source type
function getSourceIcon(label: string) {
  const l = label.toLowerCase();
  if (l.includes("twitter") || l.includes("x/twitter")) return <Twitter className="w-4 h-4" />;
  if (l.includes("facebook")) return <Facebook className="w-4 h-4" />;
  if (l.includes("instagram")) return <Instagram className="w-4 h-4" />;
  if (l.includes("youtube")) return <Youtube className="w-4 h-4" />;
  if (l.includes("wikipedia")) return <Globe className="w-4 h-4" />;
  if (l.includes("official site")) return <Crown className="w-4 h-4" />;
  if (l.includes("company")) return <Building className="w-4 h-4" />;
  if (l.includes("court") || l.includes("doj") || l.includes("fec")) return <Scale className="w-4 h-4" />;
  if (l.includes("gov")) return <FileText className="w-4 h-4" />;
  if (l.includes("edu") || l.includes("university")) return <GraduationCap className="w-4 h-4" />;
  if (l.includes("media") || l.includes("news")) return <Newspaper className="w-4 h-4" />;
  if (l.includes("database") || l.includes("directory")) return <Database className="w-4 h-4" />;
  return <ExternalLink className="w-4 h-4" />;
}

// Get badge color for source type
function getSourceBadgeVariant(label: string): "default" | "secondary" | "destructive" | "outline" {
  const l = label.toLowerCase();
  if (l.includes("official") || l.includes("verified")) return "default";
  if (l.includes("gov") || l.includes("court")) return "destructive";
  if (l.includes("media") || l.includes("news")) return "secondary";
  return "outline";
}

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { isPro, showFreeTrialPaywall } = useSubscription();
  const [profile, setProfile] = useState<MockProfile | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState<Record<string, boolean>>({});
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [showMoreSources, setShowMoreSources] = useState(false);
  const [followUpQuery, setFollowUpQuery] = useState("");

  useEffect(() => {
    const id = params.id as string;
    const found = mockProfiles.find(p => p.id === id);
    setProfile(found || null);
  }, [params.id]);

  // Handle Full Background Check button click
  const handleBackgroundCheck = () => {
    if (isPro) {
      // Pro user - could show results directly or navigate somewhere
      return;
    }
    // Show loading screen which will trigger paywall after completion
    setShowLoadingScreen(true);
  };

  // Handle loading screen completion
  const handleLoadingComplete = () => {
    setShowLoadingScreen(false);
    // If user is now pro, they can see full results
  };

  // Handle loading screen cancel (user dismissed paywall)
  const handleLoadingCancel = () => {
    setShowLoadingScreen(false);
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Profile Not Found</h1>
          <p className="text-muted-foreground mb-4">The profile you&apos;re looking for doesn&apos;t exist.</p>
          <Button onClick={() => router.push("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back Home
          </Button>
        </div>
      </div>
    );
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % profile.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + profile.images.length) % profile.images.length);
  };

  const handleImageError = (imageSrc: string) => {
    setImageError(prev => ({ ...prev, [imageSrc]: true }));
  };

  // Handle locked source click
  const handleLockedSourceClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isPro) {
      showFreeTrialPaywall();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Loading Screen Overlay */}
      <SearchLoadingScreen
        isVisible={showLoadingScreen}
        searchQuery={profile?.name || "Profile"}
        onComplete={handleLoadingComplete}
        onCancel={handleLoadingCancel}
      />
      {/* Results Paywall Modal */}
      <ResultsPaywallModal />
      {/* Main Paywall Modal */}
      <MainPaywallModal />
      
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="w-3 h-3 text-green-500" />
              Verified Profile
            </Badge>
            <Button variant="ghost" size="icon">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Profile Header */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Image Gallery */}
          <div className="lg:col-span-1">
            <Card className="overflow-hidden">
              {/* Main Image */}
              <div className="relative aspect-square bg-muted">
                <Image
                  src={imageError[profile.images[currentImageIndex]] 
                    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&size=600&background=random`
                    : profile.images[currentImageIndex]
                  }
                  alt={`${profile.name} - Photo ${currentImageIndex + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  priority
                  onError={() => handleImageError(profile.images[currentImageIndex])}
                />
                
                {/* Navigation Arrows */}
                {profile.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Image Counter */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/60 text-white text-sm">
                  {currentImageIndex + 1} / {profile.images.length}
                </div>
              </div>

              {/* Thumbnail Strip */}
              {profile.images.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto">
                  {profile.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                        idx === currentImageIndex ? 'border-primary' : 'border-transparent'
                      }`}
                    >
                      <Image
                        src={imageError[img] 
                          ? `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&size=128&background=random`
                          : img
                        }
                        alt={`Thumbnail ${idx + 1}`}
                        fill
                        className="object-cover"
                        sizes="64px"
                        onError={() => handleImageError(img)}
                      />
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">{profile.name}</h1>
              {profile.aliases.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {profile.aliases.map((alias, idx) => (
                    <Badge key={idx} variant="outline" className="text-sm">
                      {alias}
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-xl text-muted-foreground">{profile.summary}</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4 text-center">
                <div className="text-3xl font-bold text-primary">{profile.sources.length}</div>
                <div className="text-sm text-muted-foreground">Sources</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-3xl font-bold text-primary">{profile.images.length}</div>
                <div className="text-sm text-muted-foreground">Images</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-3xl font-bold text-green-500">✓</div>
                <div className="text-sm text-muted-foreground">Verified</div>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <Button className="gap-2" onClick={handleBackgroundCheck}>
                <Search className="w-4 h-4" />
                Full Background Check
              </Button>
              <Button variant="outline" className="gap-2">
                <Share2 className="w-4 h-4" />
                Share Profile
              </Button>
            </div>
          </div>
        </div>

        {/* Sources Section - Moved here */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              Sources ({profile.sources.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {/* First row: 2 free sources (indices 1 and 3 from original array) */}
              {[profile.sources[1], profile.sources[3]].filter(Boolean).map((source, idx) => (
                <a
                  key={`free-${idx}`}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-all group"
                >
                  <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                    <Globe className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                      {source.label}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {source.url.replace(/^https?:\/\//, '').split('/')[0]}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs flex-shrink-0 bg-blue-50 text-blue-600 border-blue-200">
                    Source
                  </Badge>
                </a>
              ))}

              {/* Second row: 2 locked sources (for non-pro users) or actual sources (for pro users) */}
              {[profile.sources[0], profile.sources[2]].filter(Boolean).map((source, idx) => {
                if (isPro) {
                  // Pro users see actual sources as clickable links
                  return (
                    <a
                      key={`locked-${idx}`}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-all group"
                    >
                      <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                        <Globe className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                          {source.label}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {source.url.replace(/^https?:\/\//, '').split('/')[0]}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs flex-shrink-0 bg-blue-50 text-blue-600 border-blue-200">
                        Source
                      </Badge>
                    </a>
                  );
                } else {
                  // Non-pro users see locked placeholders
                  const isSensitive = idx === 0; // First locked source shows "Sensitive Info"
                  return (
                    <div
                      key={`locked-${idx}`}
                      onClick={handleLockedSourceClick}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border transition-all cursor-pointer opacity-70 hover:opacity-90 group"
                    >
                      <div className="p-2 rounded-lg bg-muted/50 transition-colors relative">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <div className="absolute -top-1 -right-1 p-0.5 bg-blue-500 rounded-full">
                          <Lock className="w-3 h-3 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate transition-colors">
                          Source
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          Hidden
                        </div>
                      </div>
                      {isSensitive ? (
                        <Badge variant="outline" className="text-xs flex-shrink-0 bg-red-50 text-red-600 border-red-200">
                          Sensitive Info
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs flex-shrink-0 bg-blue-50 text-blue-600 border-blue-200">
                          Pro
                        </Badge>
                      )}
                    </div>
                  );
                }
              })}
            </div>

            {/* Dropdown for additional sources */}
            {profile.sources.length > 4 && (
              <div className="relative">
                <div
                  onClick={!isPro ? handleLockedSourceClick : () => setShowMoreSources(!showMoreSources)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border border-border transition-colors cursor-pointer ${
                    !isPro ? 'opacity-70 hover:opacity-90' : 'hover:bg-muted/50'
                  }`}
                >
                  <span className="text-sm font-medium">
                    +{profile.sources.length - 4} More sources
                  </span>
                  <div className="flex items-center gap-2">
                    {!isPro && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Pro
                      </Badge>
                    )}
                    {isPro && (
                      <ChevronDown className={`w-4 h-4 transition-transform ${showMoreSources ? 'rotate-180' : ''}`} />
                    )}
                  </div>
                </div>
                {showMoreSources && isPro && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    {profile.sources.slice(4).map((source, idx) => (
                      <a
                        key={idx + 4}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-all group"
                      >
                        <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                          <Globe className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                            {source.label}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {source.url.replace(/^https?:\/\//, '').split('/')[0]}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs flex-shrink-0 bg-blue-50 text-blue-600 border-blue-200">
                          Source
                        </Badge>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detailed Answer */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Detailed Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {profile.answer.split('\n\n').map((paragraph, idx) => (
                <p key={idx} className="mb-4 text-muted-foreground leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>


        {/* Related Questions Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" />
              Related
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Recommended Follow-up Questions */}
            <div className="space-y-3">
              {[
                `What professional experience does ${profile.name} have?`,
                `What investments or business ventures is ${profile.name} involved in?`,
                `What education background does ${profile.name} have?`,
                `What controversies or legal issues involve ${profile.name}?`,
                `What social media presence does ${profile.name} have?`,
              ].map((suggestion, index) => (
                <button
                  key={index}
                  onClick={!isPro ? handleLockedSourceClick : undefined}
                  className="w-full flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group text-left"
                >
                  <span className="text-sm font-medium">{suggestion}</span>
                  <div className="flex items-center gap-2">
                    {!isPro && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-blue-50 text-blue-600 border-blue-200 flex items-center gap-1"
                      >
                        <Lock className="w-3 h-3" />
                        Pro
                      </Badge>
                    )}
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary flex-shrink-0" />
                  </div>
                </button>
              ))}
            </div>

            {/* Open-ended Search Input */}
            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 mb-3">
                <Search className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Ask follow up</span>
                {!isPro && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-blue-50 text-blue-600 border-blue-200 flex items-center gap-1"
                  >
                    <Lock className="w-3 h-3" />
                    Pro
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Ask anything about this person..."
                  value={followUpQuery}
                  onChange={(e) => setFollowUpQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isPro) {
                      showFreeTrialPaywall();
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  onClick={() => {
                    if (!isPro) {
                      showFreeTrialPaywall();
                    }
                  }}
                  size="icon"
                  className="bg-red-600 hover:bg-red-700"
                >
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <div className="mt-8 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-600 dark:text-amber-400 mb-1">Important Notice</h4>
              <p className="text-sm text-muted-foreground">
                This profile is compiled from publicly available sources for informational purposes only. 
                It is not intended for employment, tenant screening, or credit decisions. 
                Always verify information through official channels before making important decisions.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


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
  ExternalLink,
  User,
  Globe,
  Share2,
  ChevronLeft,
  ChevronRight,
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
} from "lucide-react";

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
  const [profile, setProfile] = useState<MockProfile | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const id = params.id as string;
    const found = mockProfiles.find(p => p.id === id);
    setProfile(found || null);
  }, [params.id]);

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

  return (
    <div className="min-h-screen bg-background">
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
              <Button className="gap-2">
                <User className="w-4 h-4" />
                Full Background Check
              </Button>
              <Button variant="outline" className="gap-2">
                <Share2 className="w-4 h-4" />
                Share Profile
              </Button>
            </div>
          </div>
        </div>

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

        {/* Sources Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              Sources ({profile.sources.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {profile.sources.map((source, idx) => (
                <a
                  key={idx}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-all group"
                >
                  <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                    {getSourceIcon(source.label)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                      {source.label}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {source.url.replace(/^https?:\/\//, '').split('/')[0]}
                    </div>
                  </div>
                  <Badge variant={getSourceBadgeVariant(source.label)} className="text-xs flex-shrink-0">
                    {source.label.includes("gov") ? "Official" : 
                     source.label.includes("media") || source.label.includes("news") ? "Media" :
                     source.label.includes("official") ? "Verified" : "Source"}
                  </Badge>
                </a>
              ))}
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


"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { mockProfiles, type MockProfile } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  ChevronRight, 
  Star,
  Users,
  Eye
} from "lucide-react";
import { trackMostSearchedClick } from "@/lib/analytics";
import { FeaturesSlider } from "./features-slider";

interface MostSearchedProps {
  onSelectProfile?: (profile: MockProfile) => void;
}

export function MostSearched({ onSelectProfile }: MostSearchedProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <section className="mt-12">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
            <TrendingUp className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Most Searched</h2>
            <p className="text-sm text-muted-foreground">See what others are searching</p>
          </div>
        </div>
        <Badge variant="secondary" className="gap-1">
          <Eye className="w-3 h-3" />
          Live
        </Badge>
      </div>

      {/* Celebrity Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
        {mockProfiles.map((profile, index) => (
          <Link
            key={profile.id}
            href={`/profile/${profile.id}`}
            className="group"
            onMouseEnter={() => setHoveredId(profile.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={(e) => {
              // Track the click
              trackMostSearchedClick(profile.name, profile.id);
              
              if (onSelectProfile) {
                e.preventDefault();
                onSelectProfile(profile);
              }
            }}
          >
            <Card className="overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 cursor-pointer h-full">
              {/* Image Container */}
              <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-muted to-muted/50">
                <Image
                  src={profile.images[0]}
                  alt={profile.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                  // Priority load first 4 images (above the fold on most screens)
                  priority={index < 4}
                  // Add loading strategy for remaining images
                  loading={index < 4 ? "eager" : "lazy"}
                  // Blur placeholder for better perceived performance
                  placeholder="blur"
                  blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzIxMjEyMSIvPgo8L3N2Zz4="
                  onError={(e) => {
                    // Fallback to placeholder if image fails
                    const target = e.target as HTMLImageElement;
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&size=400&background=random`;
                  }}
                />
                
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                
                {/* Live indicator */}
                <div className="absolute top-2 right-2">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] text-white/90 font-medium">LIVE</span>
                  </div>
                </div>

                {/* Name overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="font-semibold text-white text-sm sm:text-base truncate drop-shadow-lg">
                    {profile.name}
                  </h3>
                  <p className="text-white/70 text-xs truncate mt-0.5">
                    {profile.summary.length > 40 
                      ? profile.summary.substring(0, 40) + "..." 
                      : profile.summary}
                  </p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-3 flex items-center justify-between bg-card">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="w-3 h-3" />
                  <span>{profile.sources.length} sources</span>
                </div>
                <ChevronRight className={`w-4 h-4 text-muted-foreground transition-all duration-300 ${
                  hoveredId === profile.id ? 'text-primary translate-x-1' : ''
                }`} />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Features Slider */}
      <FeaturesSlider />
    </section>
  );
}

// Compact version for sidebars or smaller spaces
export function MostSearchedCompact({ onSelectProfile }: MostSearchedProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <TrendingUp className="w-4 h-4" />
        <span>Trending Searches</span>
      </div>
      
      <div className="space-y-2">
        {mockProfiles.slice(0, 5).map((profile, index) => (
          <Link
            key={profile.id}
            href={`/profile/${profile.id}`}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
            onClick={(e) => {
              // Track the click
              trackMostSearchedClick(profile.name, profile.id);
              
              if (onSelectProfile) {
                e.preventDefault();
                onSelectProfile(profile);
              }
            }}
          >
            <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
              <Image
                src={profile.images[0]}
                alt={profile.name}
                fill
                className="object-cover"
                sizes="40px"
                priority={index < 3}
                loading={index < 3 ? "eager" : "lazy"}
                placeholder="blur"
                blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjMjEyMTIxIi8+Cjwvc3ZnPg=="
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&size=80&background=random`;
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                {profile.name}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {profile.sources.length} sources found
              </div>
            </div>
            <div className="text-lg font-bold text-muted-foreground/50">
              #{index + 1}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}


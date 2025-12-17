"use client";

import { Check, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/use-subscription";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect, useRef } from "react";

const features = [
  { text: "UNLIMITED people searches", emoji: "♾️" },
  { text: "Full background reports", emoji: "📋" },
  { text: "Court records access", emoji: "⚖️" },
  { text: "Username search (100+ platforms)", emoji: "🔍" },
  { text: "Vehicle VIN lookup", emoji: "🚗" },
  { text: "Privacy PROTECTION tools", emoji: "🔒" },
  { text: "Remove from data brokers + PRIVATE info monitoring", emoji: "🛡️" },
];

export function PaywallModal() {
  const { isPaywallVisible, hidePaywall } = useSubscription();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<"weekly" | "yearly">("yearly");
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(3600); // 1 hour in seconds
  const [showWeeklyOldPrice, setShowWeeklyOldPrice] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Preload video immediately on mount (before paywall is shown)
  useEffect(() => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.src = '/paywall-bg.mp4';
    video.load();
    
    video.oncanplaythrough = () => {
      setIsVideoReady(true);
    };

    // Also try to preload via link
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'video';
    link.href = '/paywall-bg.mp4';
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // When paywall becomes visible, ensure video plays
  useEffect(() => {
    if (isPaywallVisible && videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay might be blocked, that's okay
      });
    }
  }, [isPaywallVisible]);

  // Countdown timer
  useEffect(() => {
    if (!isPaywallVisible) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaywallVisible]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isPaywallVisible) return null;

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      // Allow checkout with or without being signed in
      // If signed in, we'll link the subscription to their account
      // If not signed in, they'll create an account after with the same email
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan: selectedPlan,
          userId: user?.id || undefined,
          email: user?.email || undefined,
        }),
      });

      const data = await response.json();

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to create checkout session");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      alert(error.message || "Failed to start checkout. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={hidePaywall}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md bg-card rounded-3xl border border-border shadow-2xl overflow-hidden animate-fade-in">
        {/* Close Button */}
        <button
          onClick={hidePaywall}
          className="absolute right-4 top-4 p-2 rounded-full hover:bg-muted transition-colors z-10"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header with Video Background */}
        <div className="relative aspect-video w-full overflow-hidden">
          {/* Video Background */}
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover"
            onCanPlayThrough={() => setIsVideoReady(true)}
          >
            <source src="/paywall-bg.mp4" type="video/mp4" />
          </video>
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black/50" />
          {/* Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
              🚨 ONE TIME DEAL
            </h2>
            <div className="mt-3 text-2xl md:text-3xl font-bold text-red-400 drop-shadow-lg">
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>

        {/* Plan Selection */}
        <div className="px-6 py-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setSelectedPlan("weekly");
                setShowWeeklyOldPrice(true);
              }}
              className={`relative p-4 rounded-xl border-2 transition-all ${
                selectedPlan === "weekly"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground"
              }`}
            >
              {showWeeklyOldPrice && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold whitespace-nowrap">
                  67% OFF
                </div>
              )}
              <div className="font-semibold">Weekly</div>
              {showWeeklyOldPrice && (
                <div className="text-xs text-muted-foreground line-through">$12.99</div>
              )}
              <div className="text-2xl font-bold mt-1">$6.99</div>
              <div className="text-xs text-muted-foreground">/week</div>
            </button>
            <button
              onClick={() => setSelectedPlan("yearly")}
              className={`relative p-4 rounded-xl border-2 transition-all ${
                selectedPlan === "yearly"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground"
              }`}
            >
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold whitespace-nowrap">
                91% OFF
              </div>
              <div className="text-xs text-muted-foreground line-through">$159.99</div>
              <div className="font-semibold">Yearly</div>
              <div className="text-2xl font-bold mt-1">$49.99</div>
              <div className="text-xs text-muted-foreground">/year</div>
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 gap-2">
            {features.map((feature, index) => {
              // Helper function to format text with styled spans
              const formatText = (text: string) => {
                const parts: (string | JSX.Element)[] = [];
                let remaining = text;
                let keyCounter = 0;
                
                // Process in order of specificity (longer matches first)
                const patterns = [
                  { regex: /UNLIMITED/g, className: "font-bold text-lg", replacement: "UNLIMITED" },
                  { regex: /PROTECTION/g, className: "font-bold text-lg italic", replacement: "PROTECTION" },
                  { regex: /Full/g, className: "font-bold italic", replacement: "Full" },
                  { regex: /Vehicle/g, className: "underline", replacement: "Vehicle" },
                  { regex: /\baccess\b/g, className: "underline", replacement: "access" },
                  { regex: /100\+/g, className: "italic", replacement: "100+" },
                ];
                
                // Find all matches with their positions
                const matches: Array<{ start: number; end: number; className: string; text: string }> = [];
                
                patterns.forEach(({ regex, className, replacement }) => {
                  let match;
                  const regexCopy = new RegExp(regex.source, regex.flags);
                  while ((match = regexCopy.exec(text)) !== null) {
                    matches.push({
                      start: match.index,
                      end: match.index + match[0].length,
                      className,
                      text: replacement,
                    });
                  }
                });
                
                // Sort matches by position
                matches.sort((a, b) => a.start - b.start);
                
                // Remove overlapping matches (keep first)
                const nonOverlapping: typeof matches = [];
                matches.forEach((match) => {
                  if (nonOverlapping.length === 0 || match.start >= nonOverlapping[nonOverlapping.length - 1].end) {
                    nonOverlapping.push(match);
                  }
                });
                
                // Build parts array
                let lastIndex = 0;
                nonOverlapping.forEach((match) => {
                  if (match.start > lastIndex) {
                    parts.push(text.slice(lastIndex, match.start));
                  }
                  parts.push(
                    <span key={`styled-${index}-${keyCounter++}`} className={match.className}>
                      {match.text}
                    </span>
                  );
                  lastIndex = match.end;
                });
                
                if (lastIndex < text.length) {
                  parts.push(text.slice(lastIndex));
                }
                
                return parts.length > 0 ? parts : [text];
              };
              
              return (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-green-600 font-bold" strokeWidth={3} />
                  </div>
                  <span className="text-sm flex items-center gap-2">
                    {formatText(feature.text)}
                    <span className="text-base">{feature.emoji}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="px-6 pb-6 pt-2">
          <Button
            onClick={handleSubscribe}
            isLoading={isLoading}
            size="xl"
            className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold"
          >
            <Sparkles className="w-5 h-5" />
            Start {selectedPlan === "weekly" ? "Weekly" : "Yearly"} Plan
          </Button>
          <p className="text-center text-xs text-muted-foreground mt-3">
            Cancel anytime. Instant access after purchase.
          </p>
        </div>
      </div>
    </div>
  );
}


"use client";

import { AlertTriangle, Check, X } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { useSubscription } from "@/hooks/use-subscription";
import { useEffect, useState } from "react";

const benefits = [
  { text: "UNLIMITED searches", emoji: "♾️" },
  { text: "Bust CHEATERS", emoji: "🚨" },
  { text: "Find unclaimed MONEY", emoji: "💰" },
  { text: "Remove YOUR sensitive info", emoji: "🔒" },
  { text: "Full background reports", emoji: "📋" },
  { text: "Court records access", emoji: "⚖️" },
];

export function WelcomeModal() {
  const { isPro } = useSubscription();
  const [isVisible, setIsVisible] = useState(false);
  const [showCloseButton, setShowCloseButton] = useState(false);

  useEffect(() => {
    // Check if user has seen the welcome modal before
    const hasSeenWelcome = localStorage.getItem("revealai_welcome_seen");
    
    // Debug logging
    console.log("WelcomeModal check:", { hasSeenWelcome, isPro });
    
    // Only show if:
    // 1. User hasn't seen it before
    // 2. User is not pro
    if (!hasSeenWelcome && !isPro) {
      // Small delay to ensure smooth page load
      const timer = setTimeout(() => {
        console.log("Showing welcome modal");
        setIsVisible(true);
        // Show close button after 10 seconds
        setTimeout(() => {
          setShowCloseButton(true);
        }, 10000);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isPro]);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem("revealai_welcome_seen", "true");
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md bg-card rounded-3xl border border-border shadow-2xl overflow-hidden animate-fade-in">
        {/* Close Button - appears after 10 seconds */}
        {showCloseButton && (
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 p-2 rounded-full hover:bg-muted transition-all z-10 animate-fade-in"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Header */}
        <div className="relative px-6 pt-8 pb-6 text-center bg-gradient-to-br from-primary/30 via-blue-500/20 to-purple-500/20">
          <div className="absolute inset-0 pattern-dots opacity-20" />
          <div className="relative">
            <div className="flex justify-center mb-4">
              <Logo size="lg" showText={false} />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Welcome to RevealAI</h2>
            <p className="text-foreground/80 mt-2 font-medium">
              Unlock powerful features to discover the truth
            </p>
          </div>
        </div>

        {/* Benefits */}
        <div className="px-6 py-6 bg-gradient-to-b from-card to-card/50">
          <div className="space-y-4">
            {benefits.map((benefit) => (
              <div key={benefit.text} className="flex items-center gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="w-4 h-4 text-green-500 font-bold" strokeWidth={3} />
                </div>
                <span className="text-base font-semibold text-foreground flex-1">{benefit.text}</span>
                <span className="text-2xl">{benefit.emoji}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Warning Section */}
        <div className="px-6 py-5 bg-red-500/15 border-y-2 border-red-500/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-red-600 leading-relaxed">
                Make sure to remove yourself from Reveal AI search so no one else can search you up
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


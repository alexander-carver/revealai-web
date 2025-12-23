"use client";

import { X, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import Image from "next/image";

// Function to detect Apple devices
function isAppleDevice(): boolean {
  if (typeof window === "undefined") return false;
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  const platform = window.navigator.platform.toLowerCase();
  
  // Check for iPhone, iPad, iPod
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  
  // Check for macOS (Macintosh)
  const isMacOS = /macintosh|mac os x/.test(userAgent) || platform.includes("mac");
  
  return isIOS || isMacOS;
}

export function AppleDeviceModal() {
  const [isVisible, setIsVisible] = useState(false);
  const [showCloseButton, setShowCloseButton] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the modal before
    const hasDismissed = localStorage.getItem("revealai_apple_modal_dismissed");
    
    // Only show if:
    // 1. User is on an Apple device
    // 2. User hasn't dismissed it before
    if (!hasDismissed && isAppleDevice()) {
      // Small delay to ensure smooth page load
      const timer = setTimeout(() => {
        setIsVisible(true);
        // Show close button after 3 seconds
        setTimeout(() => {
          setShowCloseButton(true);
        }, 3000);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem("revealai_apple_modal_dismissed", "true");
  };

  const handleAppStoreClick = () => {
    window.open("https://apps.apple.com/us/app/reveal-ai-people-search/id6752310763", "_blank", "noopener,noreferrer");
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={showCloseButton ? handleClose : undefined}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md bg-card rounded-3xl border border-border shadow-2xl overflow-hidden animate-fade-in">
        {/* Close Button - appears after 3 seconds */}
        {showCloseButton && (
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 p-2 rounded-full hover:bg-muted transition-all z-10 animate-fade-in"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Header */}
        <div className="relative px-6 pt-8 pb-6 text-center bg-gradient-to-br from-red-500/30 via-red-400/20 to-white/30">
          <div className="absolute inset-0 pattern-dots opacity-20" />
          <div className="relative">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-lg border-2 border-red-500/20">
                <Image
                  src="/logo.png"
                  alt="Reveal AI Logo"
                  width={48}
                  height={48}
                  className="object-contain"
                />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-foreground">Reveal AI - People Search</h2>
            <p className="text-foreground/80 mt-2 font-medium text-lg">
              Use Mobile for a better Experience 🕵️‍♂️‼️
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 bg-gradient-to-b from-card to-card/50">
          <Button
            onClick={handleAppStoreClick}
            size="lg"
            className="w-full gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold"
          >
            <Smartphone className="w-5 h-5" />
            Download on the App Store
          </Button>
        </div>
      </div>
    </div>
  );
}


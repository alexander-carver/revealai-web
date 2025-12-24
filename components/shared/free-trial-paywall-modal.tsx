"use client";

import { X, ArrowRight, Infinity, Target, Image as ImageIcon, Link2, ChevronDown } from "lucide-react";
import { useSubscription } from "@/hooks/use-subscription";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect, useRef, useCallback } from "react";

const features = [
  { 
    icon: <Infinity className="w-5 h-5" />,
    text: "Search",
    highlight: "UNLIMITED",
    suffix: "People"
  },
  { 
    icon: <Target className="w-5 h-5" />,
    text: "Unlock",
    highlight: "Deep",
    suffix: "AI-Powered Information"
  },
  { 
    icon: <ImageIcon className="w-5 h-5" />,
    text: "Uncover",
    highlight: "Photos",
    suffix: "& Online Sources"
  },
  { 
    icon: <Link2 className="w-5 h-5" />,
    text: "Find",
    highlight: "Social Media",
    suffix: "Profiles",
    highlightSuffix: true
  },
];

export function FreeTrialPaywallModal() {
  const { isFreeTrialPaywallVisible, hideFreeTrialPaywall } = useSubscription();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [showCloseButton, setShowCloseButton] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const continueButtonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check if Continue button is visible
  const checkButtonVisibility = useCallback(() => {
    if (continueButtonRef.current) {
      const rect = continueButtonRef.current.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight - 20;
      setShowScrollIndicator(!isVisible);
    }
  }, []);

  // When paywall becomes visible, ensure video plays
  // Video is already preloaded in the main page component
  useEffect(() => {
    if (isFreeTrialPaywallVisible && videoRef.current) {
      // Video should already be cached from early preload
      videoRef.current.load(); // Reload to ensure it's ready
      videoRef.current.play().catch(() => {
        // Autoplay might be blocked
      });
      setIsVideoReady(true);
      
      // Show close button after 4 seconds
      setShowCloseButton(false);
      const timer = setTimeout(() => {
        setShowCloseButton(true);
      }, 4000);
      
      return () => clearTimeout(timer);
    } else {
      setShowCloseButton(false);
    }
  }, [isFreeTrialPaywallVisible]);

  // Check button visibility on mount and scroll
  useEffect(() => {
    if (!isFreeTrialPaywallVisible) return;
    
    // Initial check after a short delay to let layout settle
    const timer = setTimeout(checkButtonVisibility, 100);
    
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', checkButtonVisibility);
    }
    window.addEventListener('scroll', checkButtonVisibility);
    window.addEventListener('resize', checkButtonVisibility);
    
    return () => {
      clearTimeout(timer);
      if (container) {
        container.removeEventListener('scroll', checkButtonVisibility);
      }
      window.removeEventListener('scroll', checkButtonVisibility);
      window.removeEventListener('resize', checkButtonVisibility);
    };
  }, [isFreeTrialPaywallVisible, checkButtonVisibility]);

  const scrollToButton = () => {
    continueButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  if (!isFreeTrialPaywallVisible) return null;

  const handleStartFreeTrial = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan: "free_trial",
          userId: user?.id || undefined,
          email: user?.email || undefined,
        }),
      });

      const data = await response.json();

      if (data.url) {
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
    <div ref={containerRef} className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-white overflow-y-auto">
      {/* Close Button - Fixed to viewport on mobile, no background */}
      <button
        onClick={hideFreeTrialPaywall}
        className={`fixed left-3 top-3 sm:absolute sm:left-4 sm:top-4 p-2 z-[200] transition-opacity duration-300 ${
          showCloseButton ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-label="Close"
      >
        <X className="h-7 w-7 text-gray-600" />
      </button>

      {/* Scroll indicator arrow - shows when Continue button isn't visible */}
      {showScrollIndicator && (
        <button
          onClick={scrollToButton}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] animate-bounce"
          aria-label="Scroll to continue"
        >
          <ChevronDown className="h-8 w-8 text-blue-500" />
        </button>
      )}

      {/* Modal - Full width on mobile, card on desktop */}
      <div className="relative w-full sm:max-w-md bg-white sm:rounded-3xl shadow-2xl overflow-hidden animate-fade-in sm:m-4 min-h-screen sm:min-h-0">
        {/* Header */}
        <div className="text-center pt-14 sm:pt-3 pb-1 relative z-10">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xl font-bold text-gray-900">Reveal AI</span>
            <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              PRO
            </span>
          </div>
        </div>

        {/* Video Background with FREE Badge */}
        <div className="relative h-44 w-full overflow-hidden">
          {/* FREE Badge - RED background, positioned in top left of video area */}
          <div className="absolute top-2 left-3 z-20">
            <div className="bg-red-500 text-white text-sm font-bold px-3 py-1.5 rounded-lg transform -rotate-12 shadow-lg">
              FREE!
            </div>
          </div>
          
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
        </div>

        {/* Content */}
        <div className="px-5 py-5">
          {/* Title */}
          <h2 className="text-center text-xl font-bold mb-4">
            GET <span className="text-blue-500">FREE</span> ACCESS
          </h2>

          {/* Features */}
          <div className="space-y-2.5 mb-5">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2.5">
                <span className="text-blue-500 flex-shrink-0">
                  {feature.icon}
                </span>
                <span className="text-gray-700 text-sm">
                  {feature.text}{" "}
                  <span className="text-blue-500 font-semibold underline decoration-blue-500">
                    {feature.highlight}
                  </span>{" "}
                  {feature.highlightSuffix ? (
                    <span className="text-blue-500 font-semibold">{feature.suffix}</span>
                  ) : (
                    <span className="font-semibold">{feature.suffix}</span>
                  )}
                </span>
              </div>
            ))}
          </div>

          {/* Plan Selection - Single Option for Free Trial */}
          <div className="mb-3">
            {/* Free Trial Plan */}
            <div className="relative w-full p-4 rounded-2xl border-2 border-blue-500 bg-blue-50/50">
              {/* FREE Badge */}
              <div className="absolute -top-2 right-4 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                FREE!
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-bold text-gray-900">WEEKLY ACCESS</div>
                  <div className="text-gray-500 text-sm">Then $9.99 per week</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-blue-500">FREE ACCESS</div>
                </div>
              </div>
            </div>
          </div>

          {/* Auto-renew notice */}
          <p className="text-center text-gray-400 text-xs mb-3">
            Auto Renewable, Cancel Anytime
          </p>

          {/* CTA Button */}
          <button
            ref={continueButtonRef}
            onClick={handleStartFreeTrial}
            disabled={isLoading}
            className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                CONTINUE
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          {/* Footer Links */}
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-400">
            <a href="/terms" className="hover:text-gray-600 transition-colors">Terms</a>
            <span>·</span>
            <a href="/privacy" className="hover:text-gray-600 transition-colors">Privacy Policy</a>
            <span>·</span>
            <button className="hover:text-gray-600 transition-colors">Restore</button>
          </div>
          
          {/* Safe area padding for iPhone home indicator */}
          <div className="h-6 sm:h-0" />
        </div>
      </div>
    </div>
  );
}


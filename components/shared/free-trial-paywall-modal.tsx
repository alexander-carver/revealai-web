"use client";

import { X, ArrowRight, Infinity, Target, Image as ImageIcon, Link2 } from "lucide-react";
import { useSubscription } from "@/hooks/use-subscription";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import Image from "next/image";

const features = [
  { 
    icon: <Infinity className="w-4 h-4 sm:w-5 sm:h-5" />,
    text: "Search",
    highlight: "UNLIMITED",
    suffix: "People"
  },
  { 
    icon: <Target className="w-4 h-4 sm:w-5 sm:h-5" />,
    text: "Unlock",
    highlight: "Deep",
    suffix: "AI-Powered Information"
  },
  { 
    icon: <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />,
    text: "Uncover",
    highlight: "Photos",
    suffix: "& Online Sources"
  },
  { 
    icon: <Link2 className="w-4 h-4 sm:w-5 sm:h-5" />,
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
  const [showCloseButton, setShowCloseButton] = useState(false);

  // Show close button after 4 seconds
  useEffect(() => {
    if (isFreeTrialPaywallVisible) {
      setShowCloseButton(false);
      const timer = setTimeout(() => {
        setShowCloseButton(true);
      }, 4000);
      return () => clearTimeout(timer);
    } else {
      setShowCloseButton(false);
    }
  }, [isFreeTrialPaywallVisible]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      {/* Close Button */}
      <button
        onClick={hideFreeTrialPaywall}
        className={`fixed left-3 top-3 sm:absolute sm:left-4 sm:top-4 p-2 z-[200] transition-opacity duration-300 ${
          showCloseButton ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-label="Close"
      >
        <X className="h-6 w-6 text-gray-600" />
      </button>

      {/* Modal - Optimized for mobile in-app browsers */}
      <div className="relative w-full h-full sm:h-auto sm:max-w-md bg-white sm:rounded-3xl sm:shadow-2xl overflow-hidden animate-fade-in sm:m-4 flex flex-col">
        {/* Header - Compact */}
        <div className="text-center pt-10 sm:pt-3 pb-1 relative z-10 flex-shrink-0">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xl font-bold text-gray-900">Reveal AI</span>
            <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              PRO
            </span>
          </div>
        </div>

        {/* Static Image Header with FREE Badge - Replaces video */}
        <div className="relative h-32 sm:h-40 w-full overflow-hidden flex-shrink-0 bg-gradient-to-b from-gray-50 to-white">
          {/* FREE Badge */}
          <div className="absolute top-2 left-3 z-20">
            <div className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg transform -rotate-12 shadow-lg">
              FREE!
            </div>
          </div>
          
          <Image
            src="/paywall-header.png"
            alt="People Search"
            fill
            className="object-cover object-center"
            priority
            unoptimized
          />
        </div>

        {/* Content - Scrollable on very small screens */}
        <div className="px-4 sm:px-5 py-3 sm:py-4 flex-1 overflow-y-auto">
          {/* Title */}
          <h2 className="text-center text-xl font-bold mb-3">
            GET <span className="text-blue-500">FREE</span> ACCESS
          </h2>

          {/* Features - Compact */}
          <div className="space-y-2 mb-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
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
            <div className="relative w-full p-3 rounded-xl border-2 border-blue-500 bg-blue-50/50">
              {/* FREE Badge */}
              <div className="absolute -top-2 right-3 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                FREE!
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-bold text-gray-900 text-sm">WEEKLY ACCESS</div>
                  <div className="text-gray-500 text-xs">Then $9.99 per week</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-500">FREE ACCESS</div>
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
            onClick={handleStartFreeTrial}
            disabled={isLoading}
            className="w-full py-3.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
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
          <div className="flex items-center justify-center gap-3 mt-3 text-xs text-gray-400">
            <a href="/terms" className="hover:text-gray-600 transition-colors">Terms</a>
            <span>·</span>
            <a href="/privacy" className="hover:text-gray-600 transition-colors">Privacy Policy</a>
            <span>·</span>
            <button className="hover:text-gray-600 transition-colors">Restore</button>
          </div>
          
          {/* Safe area padding for iPhone home indicator */}
          <div className="h-6 sm:h-0 flex-shrink-0" />
        </div>
      </div>
    </div>
  );
}


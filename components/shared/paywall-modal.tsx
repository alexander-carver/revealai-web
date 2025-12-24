"use client";

import { X, ArrowRight, Infinity, Target, Image as ImageIcon, Link2 } from "lucide-react";
import { useSubscription } from "@/hooks/use-subscription";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect, useRef } from "react";

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

export function PaywallModal() {
  const { isPaywallVisible, hidePaywall } = useSubscription();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<"weekly" | "yearly">("yearly");
  const [isLoading, setIsLoading] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // When paywall becomes visible, ensure video plays
  // Video is already preloaded in the main page component
  useEffect(() => {
    if (isPaywallVisible && videoRef.current) {
      // Video should already be cached from early preload
      videoRef.current.load(); // Reload to ensure it's ready
      videoRef.current.play().catch(() => {
        // Autoplay might be blocked
      });
      setIsVideoReady(true);
    }
  }, [isPaywallVisible]);

  if (!isPaywallVisible) return null;

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white">
      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in">
        {/* Close Button */}
        <button
          onClick={hidePaywall}
          className="absolute left-2 top-2 sm:left-4 sm:top-4 p-2.5 sm:p-2 rounded-full bg-white/90 hover:bg-gray-100 transition-colors z-[100] shadow-md"
          aria-label="Close"
        >
          <X className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700" />
        </button>

        {/* Header */}
        <div className="text-center pt-12 sm:pt-4 pb-2 relative z-10">
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-bold text-gray-900">Reveal AI</span>
            <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              PRO
            </span>
          </div>
        </div>

        {/* Video Background */}
        <div className="relative h-48 w-full overflow-hidden">
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
        <div className="px-6 py-6">
          {/* Title */}
          <h2 className="text-center text-2xl font-bold mb-4">
            GET <span className="text-blue-500">PRO</span> ACCESS
          </h2>

          {/* Features */}
          <div className="space-y-3 mb-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="text-blue-500">{feature.icon}</span>
                <span className="text-gray-700">
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

          {/* Plan Selection */}
          <div className="space-y-3 mb-4">
            {/* Yearly Plan */}
            <button
              onClick={() => setSelectedPlan("yearly")}
              className={`relative w-full p-4 rounded-2xl border-2 transition-all text-left ${
                selectedPlan === "yearly"
                  ? "border-blue-500 bg-blue-50/50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {/* Save Badge */}
              <div className="absolute -top-2 right-4 bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                SAVE 87%
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-bold text-gray-900">YEARLY ACCESS</div>
                  <div className="text-gray-500 text-sm">Just $49.99 per year</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">$0.96</div>
                  <div className="text-gray-500 text-sm">per week</div>
                </div>
              </div>
            </button>

            {/* Weekly Plan */}
            <button
              onClick={() => setSelectedPlan("weekly")}
              className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
                selectedPlan === "weekly"
                  ? "border-blue-500 bg-blue-50/50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-bold text-gray-900">WEEKLY ACCESS</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">$9.99</div>
                  <div className="text-gray-500 text-sm">per week</div>
                </div>
              </div>
            </button>
          </div>

          {/* Auto-renew notice */}
          <p className="text-center text-gray-400 text-sm mb-4">
            Auto Renewable, Cancel Anytime
          </p>

          {/* CTA Button */}
          <button
            onClick={handleSubscribe}
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
          <div className="flex items-center justify-center gap-4 mt-4 text-sm text-gray-400">
            <a href="/terms" className="hover:text-gray-600 transition-colors">Terms</a>
            <span>·</span>
            <a href="/privacy" className="hover:text-gray-600 transition-colors">Privacy Policy</a>
            <span>·</span>
            <button className="hover:text-gray-600 transition-colors">Restore</button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { X, ArrowRight, Check } from "lucide-react";
import { useSubscription } from "@/hooks/use-subscription";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import Image from "next/image";
import { trackCTAClick, trackInitiateCheckout } from "@/lib/analytics";
import { getDeviceId } from "@/lib/device-id";

// Benefits with styled text
const benefits = [
  <>Find Hidden <span className="text-red-600 font-semibold">Dating Apps</span> (Tinder, Bumble, Grindr)</>,
  <>People Search: <span className="font-bold">Vehicle</span>, Reverse Phone, Address</>,
  <>Look into <span className="italic">Criminal</span> History</>,
  <>Remove <span className="underline">Yourself</span> from Reveal AI Search</>,
  <>Find Unclaimed <span className="font-bold">Money</span> for Free</>,
];

export function FreeTrialPaywallModal() {
  const { isFreeTrialPaywallVisible, hideFreeTrialPaywall } = useSubscription();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showCloseButton, setShowCloseButton] = useState(false);

  // Show close button instantly
  useEffect(() => {
    if (isFreeTrialPaywallVisible) {
      setShowCloseButton(true);
    } else {
      setShowCloseButton(false);
    }
  }, [isFreeTrialPaywallVisible]);

  if (!isFreeTrialPaywallVisible) return null;

  const handleStartFreeTrial = async () => {
    // Track CTA click
    trackCTAClick("Free Trial Paywall - Continue");
    
    setIsLoading(true);
    try {
      // Track initiate checkout
      trackInitiateCheckout("free_trial");
      
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan: "free_trial",
          userId: user?.id || undefined,
          email: user?.email || undefined,
          deviceId: getDeviceId(), // Pass device ID for consistent user creation
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      {/* Paywall Card */}
      <div className="relative z-10 w-full max-w-[460px] mx-4 max-h-[90vh] overflow-y-auto">
        <div className="relative rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Card Background Image */}
          <div className="absolute inset-0">
            <Image
              src="/paywall_image_reveal2.png"
              alt=""
              fill
              className="object-cover"
              priority
              unoptimized
            />
            {/* White overlay for readability */}
            <div className="absolute inset-0 bg-white/85" />
          </div>
          
          {/* Close Button - Inside card, top left */}
          <button
            onClick={hideFreeTrialPaywall}
            className={`absolute left-3 top-3 p-2 z-20 rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500 ${
              showCloseButton ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            aria-label="Close"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
          
          {/* Card Content */}
          <div className="relative z-10 px-6 sm:px-8 py-8 sm:py-10">
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                GET <span className="text-red-600">FREE</span> ACCESS
              </h2>
              <p className="text-gray-500 text-sm">Start your free trial today</p>
            </div>

            {/* Benefits List */}
            <div className="space-y-3 mb-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                    <Check className="w-3 h-3 text-red-600" />
                  </div>
                  <span className="text-gray-700 text-sm leading-relaxed">{benefit}</span>
                </div>
              ))}
            </div>

            {/* Plan Selection - Single Option for Free Trial */}
            <div className="mb-6">
              {/* Free Trial Plan */}
              <div className="relative w-full p-4 rounded-xl border-2 border-red-500 bg-red-50">
                {/* FREE Badge */}
                <div className="absolute -top-2.5 right-4 bg-red-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                  FREE!
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-bold text-gray-900">WEEKLY ACCESS</div>
                    <div className="text-gray-500 text-sm">Then $9.99 per week</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-red-600">FREE ACCESS</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Auto-renew notice */}
            <p className="text-center text-gray-400 text-xs mb-4">
              Auto Renewable, Cancel Anytime
            </p>

            {/* CTA Button */}
            <button
              onClick={handleStartFreeTrial}
              disabled={isLoading}
              className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-600/25 hover:shadow-xl hover:shadow-red-600/30 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
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
            <div className="flex items-center justify-center gap-3 mt-6 text-xs text-gray-400">
              <a href="/terms" className="hover:text-gray-600 transition-colors focus:outline-none focus:underline">Terms</a>
              <span>·</span>
              <a href="/privacy" className="hover:text-gray-600 transition-colors focus:outline-none focus:underline">Privacy Policy</a>
              <span>·</span>
              <button className="hover:text-gray-600 transition-colors focus:outline-none focus:underline">Restore</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

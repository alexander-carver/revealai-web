"use client";

import { X, ArrowRight, Check } from "lucide-react";
import { useSubscription } from "@/hooks/use-subscription";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  getMetaAttributionData,
  trackCTAClick,
  trackInitiateCheckout,
} from "@/lib/analytics";
import { getDeviceId } from "@/lib/device-id";
import { getAffiliateRef } from "@/lib/affiliate";
import { formatUsd, PUBLIC_PRICING } from "@/lib/pricing";
import { getPaywallBenefits } from "@/lib/paywall-theme";
import { getProductThemeStyle } from "@/lib/search-products";

export function AbandonedPaywallModal() {
  const {
    isAbandonedPaywallVisible,
    hideAbandonedPaywall,
    paywallProductId,
  } = useSubscription();
  const { user } = useAuth();
  const router = useRouter();
  const [hasMounted, setHasMounted] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"yearly" | "weekly">("yearly");
  const [isLoading, setIsLoading] = useState(false);
  const [showCloseButton, setShowCloseButton] = useState(false);
  const paywallThemeStyle = getProductThemeStyle(paywallProductId);
  const benefits = getPaywallBenefits(paywallProductId);
  const abandonedYearlyPrice = PUBLIC_PRICING.abandonedTrialIntro;
  const abandonedCompareAtPrice = PUBLIC_PRICING.abandonedYearlyCompareAtPrice;
  const abandonedMonthlyEquivalent = (abandonedYearlyPrice / 12).toFixed(2);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Show close button instantly
  useEffect(() => {
    if (isAbandonedPaywallVisible) {
      setShowCloseButton(true);
      setSelectedPlan("yearly");
    } else {
      setShowCloseButton(false);
    }
  }, [isAbandonedPaywallVisible]);

  useEffect(() => {
    const resetLoadingState = () => setIsLoading(false);

    window.addEventListener("pageshow", resetLoadingState);
    window.addEventListener("focus", resetLoadingState);

    return () => {
      window.removeEventListener("pageshow", resetLoadingState);
      window.removeEventListener("focus", resetLoadingState);
    };
  }, []);

  if (!hasMounted || !isAbandonedPaywallVisible) return null;

  // When user closes the rescue paywall via X: hide it and return to home.
  const handleClose = () => {
    hideAbandonedPaywall();
    router.push("/");
  };

  const handleSubscribe = async () => {
    const checkoutPlan = selectedPlan === "yearly" ? "abandoned_trial" : "weekly";

    // Track CTA click
    trackCTAClick(
      `Abandoned Paywall - ${
        selectedPlan === "yearly" ? "Discounted Yearly" : "Weekly"
      }`
    );
    
    setIsLoading(true);
    try {
      // Track initiate checkout
      const initiateCheckoutEventId = trackInitiateCheckout(checkoutPlan);
      
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan: checkoutPlan,
          userId: user?.id || undefined,
          email: user?.email || undefined,
          deviceId: getDeviceId(),
          affiliateRef: getAffiliateRef() || undefined,
          metaAttribution: {
            ...getMetaAttributionData(),
            initiateCheckoutEventId,
          },
        }),
      });

      const data = await response.json();

      if (data.url) {
        localStorage.setItem("revealai_checkout_initiated", "true");
        localStorage.setItem("revealai_checkout_timestamp", Date.now().toString());
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2.5 sm:p-4"
      style={paywallThemeStyle}
    >
      {/* Paywall Card */}
      <div className="relative z-10 w-full max-w-[420px] sm:max-w-[460px] max-[420px]:scale-[0.96] max-[420px]:transform-gpu">
        <div className="relative max-h-[96dvh] overflow-hidden rounded-[24px] border border-gray-100 shadow-2xl sm:max-h-[90vh] sm:rounded-2xl">
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
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, color-mix(in srgb, var(--product-primary) 9%, white) 0%, rgba(255, 255, 255, 0.9) 34%, rgba(255, 255, 255, 0.96) 100%)",
              }}
            />
          </div>
          
          {/* Close Button - Inside card, top left */}
          <button
            onClick={handleClose}
            className={`absolute left-2.5 top-2.5 z-20 rounded-full bg-gray-100 p-1.5 transition-all duration-300 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--product-primary)] sm:left-3 sm:top-3 sm:p-2 ${
              showCloseButton ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            aria-label="Close"
          >
            <X className="h-4 w-4 text-gray-600 sm:h-5 sm:w-5" />
          </button>
          
          {/* Card Content */}
          <div className="relative z-10 px-4 pb-3 pt-4 min-[390px]:px-5 min-[390px]:pb-4 min-[390px]:pt-5 sm:px-8 sm:py-10">
            {/* Header */}
            <div className="mb-4 text-center sm:mb-6">
              <p
                className="text-[12px] font-semibold uppercase tracking-[0.12em] sm:text-[13px]"
                style={{ color: "var(--product-primary)" }}
              >
                Limited time offer
              </p>
              <h2
                className="text-[2.8rem] font-black leading-[0.86] tracking-[-0.08em] min-[390px]:text-[3rem] sm:text-[3.5rem]"
                style={{ color: "var(--product-primary)" }}
              >
                80% OFF
              </h2>
              <div className="mt-1 flex items-center justify-center gap-2 text-[13px] sm:text-[14px]">
                <span className="font-semibold text-gray-400 line-through">
                  {formatUsd(abandonedCompareAtPrice)}
                </span>
                <span className="font-semibold text-gray-500">
                  ${abandonedMonthlyEquivalent}/mo
                </span>
              </div>
              <h3 className="mt-4 text-[1.8rem] font-black leading-[0.98] tracking-[-0.04em] text-gray-900 sm:text-[2.1rem]">
                UNLOCK{" "}
                <span style={{ color: "var(--product-primary)" }}>FULL RESULTS</span>
              </h3>
              <p className="mt-2 text-[12px] text-gray-500 sm:text-sm">
                Choose {formatUsd(abandonedYearlyPrice)}/year billed annually or{" "}
                {formatUsd(PUBLIC_PRICING.weekly)}/week. Cancel anytime.
              </p>
            </div>

            {/* Benefits List */}
            <div className="mb-5 space-y-2 sm:mb-8 sm:space-y-3">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-2.5 sm:gap-3">
                  <div
                    className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full sm:h-5 sm:w-5"
                    style={{
                      backgroundColor:
                        "color-mix(in srgb, var(--product-primary) 12%, white)",
                    }}
                  >
                    <Check
                      className="h-2.5 w-2.5 sm:h-3 sm:w-3"
                      style={{ color: "var(--product-primary)" }}
                    />
                  </div>
                  <span className="text-[13px] leading-snug text-gray-700 sm:text-sm sm:leading-relaxed">{benefit}</span>
                </div>
              ))}
            </div>

            {/* Plan Selection */}
            <div className="mb-4 space-y-2 sm:mb-6 sm:space-y-2.5">
              <button
                onClick={() => setSelectedPlan("yearly")}
                className={`relative w-full rounded-xl border-2 p-3.5 text-left transition-all sm:p-[18px] ${
                  selectedPlan === "yearly"
                    ? ""
                    : "border-black bg-white hover:border-gray-700"
                }`}
                style={
                  selectedPlan === "yearly"
                    ? {
                        borderColor: "var(--product-primary)",
                        backgroundColor:
                          "color-mix(in srgb, var(--product-primary) 8%, white)",
                      }
                    : undefined
                }
              >
                <div className="absolute -top-2.5 right-2.5 sm:right-3">
                  <div
                    className="rounded-full px-2.5 py-1 text-[10px] font-bold text-white"
                    style={{ backgroundColor: "var(--product-primary)" }}
                  >
                    BEST VALUE
                  </div>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <div className="text-left">
                    <div className="mb-0.5 text-[15px] font-bold text-gray-900 sm:text-base">
                      YEARLY ACCESS
                    </div>
                    <div className="text-[11px] text-gray-500 sm:text-xs">
                      Billed today at {formatUsd(abandonedYearlyPrice)}/year
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className="text-[18px] font-semibold sm:text-xl"
                      style={{ color: "var(--product-primary)" }}
                    >
                      {formatUsd(abandonedYearlyPrice)}
                    </div>
                    <div className="text-[11px] font-medium text-gray-500 sm:text-xs">
                      per year
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setSelectedPlan("weekly")}
                className={`w-full rounded-xl border-2 p-3.5 text-left transition-all sm:p-[18px] ${
                  selectedPlan === "weekly"
                    ? ""
                    : "border-black bg-white hover:border-gray-700"
                }`}
                style={
                  selectedPlan === "weekly"
                    ? {
                        borderColor: "var(--product-primary)",
                        backgroundColor:
                          "color-mix(in srgb, var(--product-primary) 8%, white)",
                      }
                    : undefined
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="text-left">
                    <div className="mb-0.5 text-[15px] font-bold text-gray-900 sm:text-base">
                      WEEKLY ACCESS
                    </div>
                    <div className="text-[11px] text-gray-500 sm:text-xs">
                      Flexible access at {formatUsd(PUBLIC_PRICING.weekly)}/week
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className="text-[18px] font-semibold text-gray-900 sm:text-xl"
                    >
                      {formatUsd(PUBLIC_PRICING.weekly)}
                    </div>
                    <div className="text-[11px] font-medium text-gray-500 sm:text-xs">
                      per week
                    </div>
                  </div>
                </div>
              </button>
            </div>

            {/* Social proof */}
            <div className="mb-2 flex items-center justify-center gap-1.5 sm:mb-3">
              <div className="flex -space-x-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-xs text-yellow-400 sm:text-sm">★</span>
                ))}
              </div>
              <span className="text-[11px] font-medium text-gray-500 sm:text-xs">Trusted by 10,000+ users</span>
            </div>

            {/* CTA Button */}
            <button
              onClick={handleSubscribe}
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-[15px] font-bold text-white transition-all hover:opacity-95 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[var(--product-primary)] focus:ring-offset-2 sm:py-4 sm:text-lg"
              style={{
                backgroundColor: "var(--product-primary)",
                boxShadow: "0 18px 45px -24px var(--product-shadow)",
              }}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {selectedPlan === "yearly"
                    ? "Unlock Yearly Access"
                    : "Start Weekly Access"}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            {/* Trust / cancel assurance */}
            <p className="mt-2.5 text-center text-[10px] text-gray-400 sm:mt-3 sm:text-xs">
              No commitment · Cancel anytime · Secure checkout
            </p>

            {/* Footer Links */}
            <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-gray-400 sm:mt-6 sm:gap-3 sm:text-xs">
              <a href="/terms" className="hover:text-gray-600 transition-colors focus:outline-none focus:underline">Terms</a>
              <span>·</span>
              <a href="/privacy-policy" className="hover:text-gray-600 transition-colors focus:outline-none focus:underline">Privacy Policy</a>
              <span>·</span>
              <button className="hover:text-gray-600 transition-colors focus:outline-none focus:underline">Restore</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

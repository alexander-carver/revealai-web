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
import {
  formatUsd,
  PUBLIC_PRICING,
  getYearlyWeeklyEquivalent,
} from "@/lib/pricing";
import { getPaywallBenefits } from "@/lib/paywall-theme";
import { getProductThemeStyle } from "@/lib/search-products";

export function MainPaywallModal() {
  const {
    isPaywallVisible,
    hidePaywall,
    paywallProductId,
  } = useSubscription();
  const { user } = useAuth();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<"weekly" | "yearly">("yearly");
  const [isLoading, setIsLoading] = useState(false);
  const [showCloseButton, setShowCloseButton] = useState(false);
  const paywallThemeStyle = getProductThemeStyle(paywallProductId);
  const benefits = getPaywallBenefits(paywallProductId);

  // Closing any paywall should return the user to the homepage.
  const handleCloseByX = () => {
    hidePaywall();
    router.push("/");
  };

  // Show close button instantly
  useEffect(() => {
    if (isPaywallVisible) {
      setShowCloseButton(true);
    } else {
      setShowCloseButton(false);
    }
  }, [isPaywallVisible]);

  useEffect(() => {
    const resetLoadingState = () => setIsLoading(false);

    window.addEventListener("pageshow", resetLoadingState);
    window.addEventListener("focus", resetLoadingState);

    return () => {
      window.removeEventListener("pageshow", resetLoadingState);
      window.removeEventListener("focus", resetLoadingState);
    };
  }, []);

  if (!isPaywallVisible) return null;

  const handleSubscribe = async () => {
    const checkoutPlan = selectedPlan === "yearly" ? "yearly" : "weekly";

    // Track CTA click
    trackCTAClick(
      `Main Paywall - ${selectedPlan === "yearly" ? "Annual" : "Weekly"}`
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
        // Track that checkout was initiated (for abandoned transaction detection)
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

  // Calculate savings for yearly plan
  const weeklyPrice = PUBLIC_PRICING.weekly;
  const yearlyPrice = PUBLIC_PRICING.yearly;
  const ctaLabel =
    selectedPlan === "yearly"
      ? "Unlock Full Results"
      : "Start Weekly Access";
  const yearlyHeader = (
    <>
      <span className="block text-[0.94em] leading-[0.98] sm:text-[0.92em]">
        Unlock{" "}
        <span style={{ color: "var(--product-primary)" }}>
          Full Results
        </span>
      </span>
      <span className="mt-1 block text-[0.94em] leading-[0.96] sm:text-[0.92em]">
        with Yearly Access
      </span>
    </>
  );

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
          
          {/* Card Content */}
          <div className="relative z-10 px-4 pb-3 pt-3 min-[390px]:px-5 min-[390px]:pb-4 min-[390px]:pt-4 sm:px-8 sm:pb-8 sm:pt-4">
            <div className="mb-2 flex items-center justify-between pb-1.5 sm:mb-2.5 sm:pb-1.5">
              <button
                onClick={handleCloseByX}
                className={`rounded-full bg-gray-100 p-1 transition-all duration-300 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--product-primary)] sm:p-1.5 ${
                  showCloseButton ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
                aria-label="Close"
              >
                <X className="h-3.5 w-3.5 text-gray-600 sm:h-4 sm:w-4" />
              </button>
              <div className="h-5.5 w-5.5 sm:h-7 sm:w-7" aria-hidden="true" />
            </div>

            {/* Header */}
            <div className="mb-4 text-center sm:mb-6">
              <h2 className="mx-auto max-w-[12ch] text-[2.2rem] font-bold leading-[0.93] tracking-[-0.045em] text-gray-900 min-[390px]:text-[2.34rem] sm:max-w-none sm:text-[2.5rem]">
                {selectedPlan === "yearly" ? (
                  yearlyHeader
                ) : (
                  <>
                    GET{" "}
                    <span style={{ color: "var(--product-primary)" }}>PRO</span>{" "}
                    ACCESS
                  </>
                )}
              </h2>
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
                  <span className="text-[13px] leading-snug text-gray-700 sm:text-base sm:leading-relaxed">{benefit}</span>
                </div>
              ))}
            </div>

            {/* Plan Selection - Calm yearly-first layout */}
            <div className="mb-4 space-y-2 sm:mb-6 sm:space-y-2.5">
              <button
                onClick={() => setSelectedPlan("yearly")}
                className={`relative w-full rounded-xl border-2 p-3.5 transition-all sm:p-5 ${
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
                <div className="flex items-start justify-between gap-3 sm:gap-4">
                  <div className="text-left">
                    <div className="mb-0.5 text-[15px] font-bold text-gray-900 sm:text-[17px]">
                      YEARLY ACCESS
                    </div>
                  <div className="text-[11px] text-gray-500 sm:text-[13px]">
                    Billed today, renews annually
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className="text-[18px] font-semibold text-gray-900 sm:text-xl"
                    style={{ color: "var(--product-primary)" }}
                  >
                    {formatUsd(yearlyPrice)}
                    <span className="text-[11px] font-normal text-gray-500 sm:text-sm"> /year</span>
                  </div>
                  <div className="text-[10px] text-gray-500 sm:text-[11px]">
                    (Only {formatUsd(getYearlyWeeklyEquivalent())}/week)
                  </div>
                </div>
                </div>
              </button>

              <button
                onClick={() => setSelectedPlan("weekly")}
                className={`relative w-full rounded-xl border-2 px-3.5 py-2.5 transition-all sm:px-4 sm:py-3 ${
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
                <div className="flex items-center justify-between gap-3 sm:gap-4">
                  <div className="text-left">
                    <div className="text-[14px] font-bold text-gray-900 sm:text-[15px]">WEEKLY ACCESS</div>
                    <div className="text-[11px] text-gray-500 sm:text-[12px]">
                      Billed today, renews weekly
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[16px] font-semibold text-gray-900 sm:text-[17px]">
                      {formatUsd(weeklyPrice)}
                      <span className="text-[11px] font-normal text-gray-500 sm:text-[13px]"> /week</span>
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
                  {ctaLabel}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            {/* Trust / cancel assurance */}
            <p className="mt-2.5 text-center text-[10px] text-gray-400 sm:mt-3 sm:text-xs">
              {selectedPlan === "yearly"
                ? "Instant access · Cancel anytime · Secure checkout"
                : "Instant access · Cancel anytime · Secure checkout"}
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

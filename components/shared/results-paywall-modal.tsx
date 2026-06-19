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

const INITIAL_COUNTDOWN_SECONDS = 472; // 7 minutes 52 seconds
const COUNTDOWN_STORAGE_KEY = "revealai_paywall_countdown";
type OfferPlan = "annual_offer" | "weekly";

export function ResultsPaywallModal() {
  const {
    isResultsPaywallVisible,
    hideResultsPaywall,
    paywallProductId,
  } = useSubscription();
  const { user } = useAuth();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<OfferPlan>("annual_offer");
  const [isLoading, setIsLoading] = useState(false);
  const [showCloseButton, setShowCloseButton] = useState(false);
  const [countdown, setCountdown] = useState(INITIAL_COUNTDOWN_SECONDS);
  const paywallThemeStyle = getProductThemeStyle(paywallProductId);
  const benefits = getPaywallBenefits(paywallProductId);

  // Initialize and manage persistent countdown timer
  useEffect(() => {
    if (!isResultsPaywallVisible) return;

    // Get stored countdown or initialize
    const storedData = typeof window !== "undefined" ? localStorage.getItem(COUNTDOWN_STORAGE_KEY) : null;
    let initialCountdown = INITIAL_COUNTDOWN_SECONDS;
    let storedTimestamp = Date.now();

    if (storedData) {
      try {
        const { remaining, timestamp } = JSON.parse(storedData);
        const elapsed = (Date.now() - timestamp) / 1000; // in seconds with decimals
        initialCountdown = Math.max(0, remaining - elapsed);
        storedTimestamp = timestamp;
      } catch (e) {
        // Invalid data, reset to initial
        initialCountdown = INITIAL_COUNTDOWN_SECONDS;
        storedTimestamp = Date.now();
      }
    }

    setCountdown(initialCountdown);

    // Update countdown every second
    const interval = setInterval(() => {
      if (storedTimestamp) {
        const elapsed = (Date.now() - storedTimestamp) / 1000;
        const newValue = Math.max(0, INITIAL_COUNTDOWN_SECONDS - elapsed);
        
        setCountdown(newValue);
        
        // Save to localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem(
            COUNTDOWN_STORAGE_KEY,
            JSON.stringify({
              remaining: Math.floor(newValue),
              timestamp: storedTimestamp,
            })
          );
        }
      }
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [isResultsPaywallVisible]);

  // Format countdown as MM:SS
  const formatCountdown = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Show close button instantly
  useEffect(() => {
    if (isResultsPaywallVisible) {
      setShowCloseButton(true);
    } else {
      setShowCloseButton(false);
    }
  }, [isResultsPaywallVisible]);

  useEffect(() => {
    const resetLoadingState = () => setIsLoading(false);

    window.addEventListener("pageshow", resetLoadingState);
    window.addEventListener("focus", resetLoadingState);

    return () => {
      window.removeEventListener("pageshow", resetLoadingState);
      window.removeEventListener("focus", resetLoadingState);
    };
  }, []);

  if (!isResultsPaywallVisible) return null;

  const handleClose = () => {
    hideResultsPaywall();
    router.push("/");
  };

  const handleStartAccess = async () => {
    const checkoutPlan = selectedPlan;
    const isWeekly = checkoutPlan === "weekly";

    // Track CTA click
    trackCTAClick(
      isWeekly
        ? "Results Paywall - Weekly Access"
        : "Results Paywall - Annual Access"
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

  const isWeeklySelected = selectedPlan === "weekly";
  const selectedPrice = isWeeklySelected
    ? PUBLIC_PRICING.weekly
    : PUBLIC_PRICING.annualTrialPrice;
  const selectedCadence = isWeeklySelected ? "week" : "year";

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
            {/* Countdown Timer - Large and Prominent at Top */}
            <div className="mb-5 flex flex-col items-center sm:mb-8">
              <div className="mb-1.5 text-center sm:mb-2">
                <span
                  className="text-base font-bold sm:text-xl"
                  style={{ color: "var(--product-primary)" }}
                >
                  Limited time offer
                </span>
              </div>
              <div className="text-center">
                <span
                  className="font-mono text-4xl font-black tabular-nums tracking-tight sm:text-6xl"
                  style={{ color: "var(--product-primary)" }}
                >
                  {formatCountdown(countdown)}
                </span>
              </div>
            </div>

            {/* Header */}
            <div className="mb-4 text-center sm:mb-6">
              <h2 className="mb-1.5 text-[1.7rem] font-bold leading-[1.05] tracking-[-0.03em] text-gray-900 sm:mb-2 sm:text-3xl">
                UNLOCK{" "}
                <span style={{ color: "var(--product-primary)" }}>FULL</span>{" "}
                RESULTS
              </h2>
              <p className="text-[12px] text-gray-500 sm:text-sm">
                Pay {formatUsd(selectedPrice)} today for {selectedCadence}ly access. Cancel anytime.
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
                type="button"
                onClick={() => setSelectedPlan("annual_offer")}
                className={`relative w-full rounded-xl border-2 p-3.5 text-left transition-all sm:p-4 ${
                  selectedPlan === "annual_offer"
                    ? ""
                    : "border-black bg-white hover:border-gray-700"
                }`}
                style={
                  selectedPlan === "annual_offer"
                    ? {
                        borderColor: "var(--product-primary)",
                        backgroundColor:
                          "color-mix(in srgb, var(--product-primary) 8%, white)",
                      }
                    : undefined
                }
              >
                <div className="flex items-start justify-between gap-3 sm:items-center">
                  <div>
                    <div className="text-[15px] font-bold text-gray-900">ANNUAL ACCESS</div>
                    <div className="text-[11px] text-gray-500 sm:text-sm">
                      Billed today, renews annually
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className="text-lg font-bold sm:text-xl"
                      style={{ color: "var(--product-primary)" }}
                    >
                      {formatUsd(PUBLIC_PRICING.annualTrialPrice)}
                      <span className="text-[11px] font-normal text-gray-500 sm:text-sm"> /year</span>
                    </div>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPlan("weekly")}
                className={`relative w-full rounded-xl border-2 p-3.5 text-left transition-all sm:p-4 ${
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
                <div className="flex items-start justify-between gap-3 sm:items-center">
                  <div>
                    <div className="text-[15px] font-bold text-gray-900">WEEKLY ACCESS</div>
                    <div className="text-[11px] text-gray-500 sm:text-sm">
                      Billed today, renews weekly
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className="text-lg font-bold sm:text-xl"
                      style={{ color: "var(--product-primary)" }}
                    >
                      {formatUsd(PUBLIC_PRICING.weekly)}
                      <span className="text-[11px] font-normal text-gray-500 sm:text-sm"> /week</span>
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
              onClick={handleStartAccess}
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
                  Unlock {isWeeklySelected ? "Weekly Access" : "Full Results"}
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

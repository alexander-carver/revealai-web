"use client";

import { useState, useEffect } from "react";
import { Check, Lock, Star, Loader2 } from "lucide-react";
import Image from "next/image";
import {
  getProductThemeStyle,
  getSearchProduct,
  type SearchProductId,
} from "@/lib/search-products";

const LOADING_PORTRAIT_PATHS = [
  "/loading-portraits/portrait-1.png",
  "/loading-portraits/portrait-2.png",
  "/loading-portraits/portrait-3.png",
  "/loading-portraits/portrait-4.png",
  "/loading-portraits/portrait-5.png",
  "/loading-portraits/portrait-6.png",
];

const PORTRAIT_SLOTS = [
  { angle: "0deg", tilt: "-6deg", delay: "0ms" },
  { angle: "60deg", tilt: "7deg", delay: "220ms" },
  { angle: "120deg", tilt: "-8deg", delay: "440ms" },
  { angle: "180deg", tilt: "6deg", delay: "660ms" },
  { angle: "240deg", tilt: "-7deg", delay: "880ms" },
  { angle: "300deg", tilt: "5deg", delay: "1100ms" },
] as const;

// Source logo paths
const SOURCE_LOGO_PATHS = [
  "/sources/source-1.png",
  "/sources/source-2.png",
  "/sources/source-3.png",
  "/sources/source-4.png",
  "/sources/source-5.png",
  "/sources/source-6.png",
];

interface SearchLoadingScreenProps {
  isVisible: boolean;
  searchQuery: string;
  onComplete: () => void;
  onCancel: () => void;
  productId?: SearchProductId;
  showLongSearchNote?: boolean;
}

export function SearchLoadingScreen({
  isVisible,
  searchQuery,
  onComplete,
  onCancel,
  productId = "people",
  showLongSearchNote = false,
}: SearchLoadingScreenProps) {
  const product = getSearchProduct(productId);
  const progressSteps = product.loading.steps;
  const testimonials = product.loading.testimonials;
  const productThemeStyle = getProductThemeStyle(productId);

  // NOTE: Paywall is now handled by the parent component (people-search.tsx)
  // This loading screen just shows the animation
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [currentCenterAvatar, setCurrentCenterAvatar] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  // Reset state when visibility changes
  useEffect(() => {
    if (isVisible) {
      setCurrentStep(0);
      setProgress(0);
      setCurrentTestimonial(0);
      setCurrentCenterAvatar(0);
      setStartTime(Date.now());
    } else {
      setStartTime(null);
    }
  }, [isVisible]);

  // Main progress timer (12 seconds total for first 4 steps)
  // Custom easing to slow down at 3s and 9s
  useEffect(() => {
    if (!isVisible || !startTime) return;

    const totalDuration = 12000; // 12 seconds
    const interval = 50; // Update every 50ms for smooth animation

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      
      // Custom progress calculation with slowdowns at 3s and 9s
      let newProgress = 0;
      if (elapsed < 3000) {
        // 0-3s: Fast progress to 25%
        newProgress = (elapsed / 3000) * 25;
      } else if (elapsed < 6000) {
        // 3-6s: Normal progress from 25% to 50%
        newProgress = 25 + ((elapsed - 3000) / 3000) * 25;
      } else if (elapsed < 9000) {
        // 6-9s: Normal progress from 50% to 75%
        newProgress = 50 + ((elapsed - 6000) / 3000) * 25;
      } else if (elapsed < 12000) {
        // 9-12s: Slow progress from 75% to 100%
        const t = (elapsed - 9000) / 3000;
        // Ease out curve for the final stretch
        newProgress = 75 + (Math.pow(t, 0.5) * 25);
      } else {
        newProgress = 100;
      }
      
      setProgress(Math.min(newProgress, 100));

      // Update current step based on elapsed time
      const newStep = progressSteps.findIndex(
        (step) => elapsed < step.completionTime
      );
      if (newStep !== -1) {
        setCurrentStep(newStep);
      } else {
        // All timed steps completed, we're on step 5 (index 4)
        setCurrentStep(4);
      }

      // At 12 seconds, animation is complete
      // NOTE: Paywall logic is handled by parent component (people-search.tsx)
      // This just keeps showing the loading animation indefinitely for non-Pro users
    }, interval);

    return () => clearInterval(timer);
  }, [isVisible, startTime, progressSteps]);

  // Testimonial rotation timer (every 10 seconds)
  useEffect(() => {
    if (!isVisible) return;

    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 10000);

    return () => clearInterval(timer);
  }, [isVisible, testimonials.length]);

  // Center avatar rotation timer (every 0.7 seconds)
  useEffect(() => {
    if (!isVisible) return;

    const timer = setInterval(() => {
      setCurrentCenterAvatar((prev) => (prev + 1) % LOADING_PORTRAIT_PATHS.length);
    }, 1400);

    return () => clearInterval(timer);
  }, [isVisible]);

  // Prevent body scroll when visible
  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-40 bg-white flex flex-col items-center justify-center px-4 overflow-hidden"
      style={{
        ...productThemeStyle,
        background:
          "linear-gradient(180deg, var(--product-gradient-from) 0%, #ffffff 100%)",
      }}
    >
      {/* Background subtle pattern */}
      <div className="absolute inset-0 pattern-dots opacity-30 pointer-events-none" />
      
      {/* Portrait loading orbit */}
      <div className="relative mb-7 flex h-[270px] w-[270px] flex-shrink-0 items-center justify-center md:h-[330px] md:w-[330px]">
        {/* Ambient glow */}
        <div
          className="absolute inset-[34px] rounded-full blur-2xl md:inset-[42px]"
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--product-primary) 20%, transparent) 0%, color-mix(in srgb, var(--product-primary) 8%, transparent) 42%, transparent 74%)",
          }}
        />

        {/* Primary outer shell */}
        <div
          className="absolute inset-[28px] rounded-full border md:inset-[34px]"
          style={{
            borderColor: "color-mix(in srgb, var(--product-primary) 16%, transparent)",
            background:
              "radial-gradient(circle at center, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.9) 52%, color-mix(in srgb, var(--product-primary) 4%, white) 100%)",
            boxShadow:
              "0 32px 70px -40px var(--product-shadow), inset 0 1px 0 rgba(255,255,255,0.85)",
          }}
        />

        {/* Inner portrait band */}
        <div
          className="absolute inset-[54px] rounded-full border md:inset-[68px]"
          style={{
            borderColor: "color-mix(in srgb, var(--product-primary) 20%, transparent)",
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--product-primary) 7%, white) 0%, rgba(255,255,255,0.9) 62%, rgba(255,255,255,0.78) 100%)",
          }}
        />

        {/* Portrait chips */}
        {LOADING_PORTRAIT_PATHS.map((avatar, index) => {
          const slot = PORTRAIT_SLOTS[index];

          return (
            <div
              key={index}
              className="orbit-item absolute left-1/2 top-1/2 z-20"
              style={{
                ["--start-angle" as string]: slot.angle,
              }}
            >
              <div
                className="loading-portrait-card relative flex h-[46px] w-[46px] items-center justify-center rounded-full md:h-[54px] md:w-[54px]"
                style={{
                  backgroundColor: "rgba(255,255,255,0.76)",
                  boxShadow:
                    "0 18px 38px -22px rgba(15, 23, 42, 0.38), inset 0 1px 0 rgba(255,255,255,0.92)",
                  animation: "loading-portrait-float 4.6s ease-in-out infinite",
                  animationDelay: slot.delay,
                  transform: `rotate(${slot.tilt})`,
                }}
              >
                <div
                  className="relative h-[38px] w-[38px] overflow-hidden rounded-full ring-2 ring-white md:h-[44px] md:w-[44px]"
                  style={{
                    boxShadow:
                      "0 12px 24px -16px rgba(15, 23, 42, 0.42), 0 0 0 1px color-mix(in srgb, var(--product-primary) 12%, transparent)",
                  }}
                >
                  <Image
                    src={avatar}
                    alt={`Portrait ${index + 1}`}
                    width={44}
                    height={44}
                    className="h-full w-full scale-110 object-cover blur-[2.5px] saturate-[0.92] brightness-[0.94]"
                    loading="lazy"
                    quality={78}
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/18 via-transparent to-black/8" />
                </div>
              </div>
            </div>
          );
        })}

        {/* Center locked result */}
        <div
          className="absolute left-1/2 top-1/2 z-30 h-[118px] w-[118px] -translate-x-1/2 -translate-y-1/2 rounded-full p-[10px] md:h-[144px] md:w-[144px] md:p-[12px]"
          style={{
            background:
              "linear-gradient(145deg, rgba(255,255,255,0.98), color-mix(in srgb, var(--product-primary) 8%, white))",
            boxShadow:
              "0 34px 80px -34px var(--product-shadow), inset 0 1px 0 rgba(255,255,255,0.92)",
          }}
        >
          <div className="relative h-full w-full overflow-hidden rounded-full ring-4 ring-white/90">
            {LOADING_PORTRAIT_PATHS.map((avatar, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-300 ${
                  index === currentCenterAvatar ? "opacity-100" : "opacity-0"
                }`}
              >
                <Image
                  src={avatar}
                  alt="Center Avatar"
                  width={144}
                  height={144}
                  className="h-full w-full scale-[1.16] object-cover blur-[10px] saturate-[0.88] brightness-[0.84]"
                  priority={index === 0}
                  quality={82}
                />
              </div>
            ))}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(255,255,255,0.14),transparent_44%)]" />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(0,0,0,0.12) 100%)",
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/26 backdrop-blur-[5px]">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full md:h-14 md:w-14"
                style={{
                  backgroundColor: "rgba(255,255,255,0.94)",
                  boxShadow:
                    "0 16px 35px -20px rgba(15, 23, 42, 0.6), inset 0 1px 0 rgba(255,255,255,0.95)",
                }}
              >
                <Lock className="h-6 w-6 text-gray-700 md:h-7 md:w-7" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Title - with z-index to stay above orbit */}
      <h2 className="text-lg md:text-2xl font-bold text-gray-900 mb-3 md:mb-4 text-center search-title relative z-30 px-2">
        {product.loading.queryLabel}{" "}
        <span style={{ color: "var(--product-primary)" }}>{searchQuery || "..."}</span>
      </h2>

      {showLongSearchNote ? (
        <p className="mb-4 max-w-sm px-6 text-center text-xs text-gray-500 md:mb-5 md:text-sm relative z-30">
          Pro searches can take up to 2 to 5 minutes. Keep this tab open while we gather sources, images, and report details.
        </p>
      ) : null}

      {/* Source Logos */}
      <div className="flex items-center justify-center gap-1.5 md:gap-2 mb-6 md:mb-8 flex-wrap relative z-30 px-4">
        {SOURCE_LOGO_PATHS.map((logo, index) => (
          <div
            key={index}
            className="w-[24px] h-[24px] md:w-[28px] md:h-[28px] rounded-full flex items-center justify-center overflow-hidden shadow-sm border"
            style={{
              backgroundColor: "rgba(255,255,255,0.86)",
              borderColor: "color-mix(in srgb, var(--product-primary) 12%, transparent)",
            }}
          >
            <Image
              src={logo}
              alt={`Source ${index + 1}`}
              width={16}
              height={16}
              className="w-[12px] h-[12px] md:w-[16px] md:h-[16px] object-contain"
              loading="lazy"
              quality={75}
            />
          </div>
        ))}
        <span
          className="text-[10px] md:text-xs text-gray-500 px-2 py-0.5 md:py-1 rounded-full ml-1 border"
          style={{
            backgroundColor: "rgba(255,255,255,0.86)",
            borderColor: "color-mix(in srgb, var(--product-primary) 12%, transparent)",
          }}
        >
          +5 more
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-xs md:max-w-sm mb-4 md:mb-6 px-4 relative z-30">
        <div className="h-1.5 md:h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full rounded-full transition-all duration-100 ease-linear"
            style={{
              width: `${Math.min(progress * 0.95, 95)}%`,
              backgroundImage:
                "linear-gradient(90deg, var(--product-primary), var(--product-primary-hover))",
            }}
          />
        </div>
      </div>

      {/* Progress Steps */}
      <div className="w-full max-w-xs md:max-w-sm space-y-2 md:space-y-3 mb-6 md:mb-8 px-4 relative z-30">
        {progressSteps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isLastStep = index === progressSteps.length - 1;

          return (
            <div 
              key={step.id} 
              className={`flex items-center gap-2 md:gap-3 transition-all duration-300 ${
                isCompleted || isCurrent ? "opacity-100" : "opacity-40"
              }`}
            >
              {/* Icon */}
              <div className="flex-shrink-0">
                {isCompleted ? (
                  <div
                    className="w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center shadow-sm"
                    style={{ backgroundColor: "var(--product-primary)" }}
                  >
                    <Check className="w-3 h-3 md:w-3.5 md:h-3.5 text-white" strokeWidth={3} />
                  </div>
                ) : isCurrent && isLastStep ? (
                  <div className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" style={{ color: "var(--product-primary)" }} />
                  </div>
                ) : isCurrent ? (
                  <div
                    className="w-5 h-5 md:w-6 md:h-6 rounded-full border-2"
                    style={{
                      borderColor: "var(--product-primary)",
                      backgroundColor:
                        "color-mix(in srgb, var(--product-primary) 12%, transparent)",
                    }}
                  />
                ) : (
                  <div className="w-5 h-5 md:w-6 md:h-6 rounded-full border-2 border-gray-200" />
                )}
              </div>
              {/* Text */}
              <div className="flex flex-col">
                <span
                  className={`text-xs md:text-sm transition-colors duration-300 ${
                    isCompleted
                      ? "text-gray-700"
                      : isCurrent
                      ? "font-medium"
                      : "text-gray-400"
                  }`}
                  style={isCurrent ? { color: "var(--product-primary)" } : undefined}
                >
                  {step.text}
                </span>
                {isCurrent && step.detail && (
                  <span className="text-[10px] md:text-xs text-gray-400 mt-0.5 animate-pulse">
                    {step.detail}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Testimonial Card */}
      <div
        className="w-full max-w-xs md:max-w-sm rounded-2xl p-4 md:p-5 shadow-sm border relative min-h-[120px] md:min-h-[140px] mx-4 z-30"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.96) 0%, color-mix(in srgb, var(--product-primary) 4%, white) 100%)",
          borderColor: "color-mix(in srgb, var(--product-primary) 12%, rgba(229, 231, 235, 1))",
          boxShadow: "0 22px 50px -34px rgba(15, 23, 42, 0.24)",
        }}
      >
        {/* Crossfade testimonials */}
        {testimonials.map((testimonial, index) => (
          <div
            key={index}
            className={`transition-all duration-500 ${
              index === currentTestimonial
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-2 absolute inset-4 md:inset-5 pointer-events-none"
            }`}
          >
            {/* Stars */}
            <div className="flex gap-0.5 mb-2 md:mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className="w-3.5 h-3.5 md:w-4 md:h-4"
                  style={{
                    fill: "var(--product-primary)",
                    color: "var(--product-primary)",
                  }}
                />
              ))}
            </div>
            {/* Title */}
            <h4 className="font-semibold text-gray-900 mb-1 md:mb-2 text-sm md:text-base">
              &ldquo;{testimonial.title}&rdquo;
            </h4>
            {/* Quote */}
            <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
              {testimonial.quote}
            </p>
          </div>
        ))}
      </div>

      {/* Testimonial dots indicator */}
      <div className="flex gap-1.5 mt-3 md:mt-4 relative z-30">
        {testimonials.map((_, index) => (
          <div
            key={index}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              index === currentTestimonial
                ? "w-4"
                : "bg-gray-300"
            }`}
            style={index === currentTestimonial ? { backgroundColor: "var(--product-primary)" } : undefined}
          />
        ))}
      </div>
    </div>
  );
}

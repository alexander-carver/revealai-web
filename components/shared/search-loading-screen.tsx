"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, Lock, Star, Loader2 } from "lucide-react";
import { useSubscription } from "@/hooks/use-subscription";
import Image from "next/image";

// Progress steps configuration
const PROGRESS_STEPS = [
  { id: 1, text: "Catching the signals…", completionTime: 3000 },
  { id: 2, text: "Diving deep into the data…", completionTime: 6000 },
  { id: 3, text: "Uncovering hidden insights…", completionTime: 9000 },
  { id: 4, text: "Following the trail…", completionTime: 12000 },
  { id: 5, text: "Finalizing the search…", completionTime: Infinity }, // Never completes
];

// Testimonials configuration
const TESTIMONIALS = [
  {
    title: "Pocket Detective",
    quote:
      "Checking a new match? Reveal AI digs up mutual friends and recent posts fast. Feels like having my own mini investigator.",
  },
  {
    title: "Perfect for a Quick Peek",
    quote:
      "Wanted to see what my crush is doing. Reveal AI found their hidden accounts right away. Now I know the latest.",
  },
  {
    title: "Crazy Fast",
    quote:
      "I typed a name and all their links popped up in seconds. No waiting.",
  },
];

// Avatar paths for orbiting and center avatars
const AVATAR_PATHS = [
  "/avatars/orbit-1.png",
  "/avatars/orbit-2.png",
  "/avatars/orbit-3.png",
  "/avatars/orbit-4.png",
  "/avatars/orbit-5.png",
  "/avatars/orbit-6.png",
];

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
}

export function SearchLoadingScreen({
  isVisible,
  searchQuery,
  onComplete,
  onCancel,
}: SearchLoadingScreenProps) {
  const { isPro, showPaywall, isPaywallVisible } = useSubscription();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [currentCenterAvatar, setCurrentCenterAvatar] = useState(0);
  const [hasTriggeredPaywall, setHasTriggeredPaywall] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);

  // Reset state when visibility changes
  useEffect(() => {
    if (isVisible) {
      setCurrentStep(0);
      setProgress(0);
      setCurrentTestimonial(0);
      setCurrentCenterAvatar(0);
      setHasTriggeredPaywall(false);
      setStartTime(Date.now());
    } else {
      setStartTime(null);
    }
  }, [isVisible]);

  // Main progress timer (12 seconds total for first 4 steps)
  useEffect(() => {
    if (!isVisible || !startTime) return;

    const totalDuration = 12000; // 12 seconds
    const interval = 50; // Update every 50ms for smooth animation

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / totalDuration) * 100, 100);
      setProgress(newProgress);

      // Update current step based on elapsed time
      const newStep = PROGRESS_STEPS.findIndex(
        (step) => elapsed < step.completionTime
      );
      if (newStep !== -1) {
        setCurrentStep(newStep);
      } else {
        // All timed steps completed, we're on step 5 (index 4)
        setCurrentStep(4);
      }

      // At 12 seconds, check subscription status
      if (elapsed >= totalDuration && !hasTriggeredPaywall) {
        setHasTriggeredPaywall(true);
        if (isPro) {
          // Pro user - show results immediately
          onComplete();
        } else {
          // Non-pro user - show paywall
          showPaywall();
        }
      }
    }, interval);

    return () => clearInterval(timer);
  }, [isVisible, startTime, isPro, onComplete, showPaywall, hasTriggeredPaywall]);

  // Testimonial rotation timer (every 10 seconds)
  useEffect(() => {
    if (!isVisible) return;

    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 10000);

    return () => clearInterval(timer);
  }, [isVisible]);

  // Center avatar rotation timer (every 0.7 seconds)
  useEffect(() => {
    if (!isVisible) return;

    const timer = setInterval(() => {
      setCurrentCenterAvatar((prev) => (prev + 1) % AVATAR_PATHS.length);
    }, 700);

    return () => clearInterval(timer);
  }, [isVisible]);

  // Watch for paywall visibility changes to handle dismiss/subscribe
  useEffect(() => {
    if (hasTriggeredPaywall && !isPaywallVisible) {
      if (isPro) {
        // User subscribed via paywall
        onComplete();
      } else {
        // User dismissed paywall without subscribing
        onCancel();
      }
    }
  }, [isPaywallVisible, isPro, hasTriggeredPaywall, onCancel, onComplete]);

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

  // Calculate orbit positions for 6 avatars evenly distributed
  const orbitRadius = { mobile: 100, desktop: 130 };

  return (
    <div className="fixed inset-0 z-40 bg-white flex flex-col items-center justify-center px-4 overflow-hidden">
      {/* Background subtle pattern */}
      <div className="absolute inset-0 pattern-dots opacity-30 pointer-events-none" />
      
      {/* Center Ring Animation Container - with extra padding to contain orbiting avatars */}
      <div className="relative w-[260px] h-[260px] md:w-[320px] md:h-[320px] mb-6 flex-shrink-0">
        {/* Outer ring glow */}
        <div className="absolute inset-[30px] md:inset-[25px] rounded-full bg-[#0087FF]/5 animate-pulse" />
        
        {/* Outer rotating ring */}
        <div className="absolute inset-[30px] md:inset-[25px] rounded-full border-2 border-[#0087FF]/20 animate-orbit-ring" />
        
        {/* Secondary ring */}
        <div 
          className="absolute inset-[40px] md:inset-[35px] rounded-full border border-[#0087FF]/10 animate-orbit-ring"
          style={{ animationDirection: "reverse", animationDuration: "15s" }}
        />
        
        {/* Orbiting avatars - using inline styles for reliable positioning */}
        {AVATAR_PATHS.map((avatar, index) => {
          const angle = (index * 60) * (Math.PI / 180); // Convert to radians, 60 degrees apart
          return (
            <div
              key={index}
              className="absolute w-[36px] h-[36px] md:w-[42px] md:h-[42px] rounded-full overflow-hidden shadow-lg ring-2 ring-white z-10"
              style={{
                left: "50%",
                top: "50%",
                marginLeft: "-18px",
                marginTop: "-18px",
                animation: `orbit-path-${index} 12s linear infinite`,
              }}
            >
              <Image
                src={avatar}
                alt={`Avatar ${index + 1}`}
                width={42}
                height={42}
                className="w-full h-full object-cover blur-[3px]"
              />
            </div>
          );
        })}

        {/* Center blurred avatar with lock */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[100px] h-[100px] md:w-[120px] md:h-[120px] rounded-full overflow-hidden shadow-2xl ring-4 ring-white z-20">
          {/* Crossfade container */}
          <div className="relative w-full h-full">
            {AVATAR_PATHS.map((avatar, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-300 ${
                  index === currentCenterAvatar ? "opacity-100" : "opacity-0"
                }`}
              >
                <Image
                  src={avatar}
                  alt="Center Avatar"
                  width={120}
                  height={120}
                  className="w-full h-full object-cover blur-[8px] scale-110"
                />
              </div>
            ))}
          </div>
          {/* Lock overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/95 flex items-center justify-center shadow-xl">
              <Lock className="w-6 h-6 md:w-7 md:h-7 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Inline keyframes for each orbiting avatar */}
      <style jsx>{`
        @keyframes orbit-path-0 {
          from { transform: rotate(0deg) translateX(85px) rotate(0deg); }
          to { transform: rotate(360deg) translateX(85px) rotate(-360deg); }
        }
        @keyframes orbit-path-1 {
          from { transform: rotate(60deg) translateX(85px) rotate(-60deg); }
          to { transform: rotate(420deg) translateX(85px) rotate(-420deg); }
        }
        @keyframes orbit-path-2 {
          from { transform: rotate(120deg) translateX(85px) rotate(-120deg); }
          to { transform: rotate(480deg) translateX(85px) rotate(-480deg); }
        }
        @keyframes orbit-path-3 {
          from { transform: rotate(180deg) translateX(85px) rotate(-180deg); }
          to { transform: rotate(540deg) translateX(85px) rotate(-540deg); }
        }
        @keyframes orbit-path-4 {
          from { transform: rotate(240deg) translateX(85px) rotate(-240deg); }
          to { transform: rotate(600deg) translateX(85px) rotate(-600deg); }
        }
        @keyframes orbit-path-5 {
          from { transform: rotate(300deg) translateX(85px) rotate(-300deg); }
          to { transform: rotate(660deg) translateX(85px) rotate(-660deg); }
        }
        @media (min-width: 768px) {
          @keyframes orbit-path-0 {
            from { transform: rotate(0deg) translateX(110px) rotate(0deg); }
            to { transform: rotate(360deg) translateX(110px) rotate(-360deg); }
          }
          @keyframes orbit-path-1 {
            from { transform: rotate(60deg) translateX(110px) rotate(-60deg); }
            to { transform: rotate(420deg) translateX(110px) rotate(-420deg); }
          }
          @keyframes orbit-path-2 {
            from { transform: rotate(120deg) translateX(110px) rotate(-120deg); }
            to { transform: rotate(480deg) translateX(110px) rotate(-480deg); }
          }
          @keyframes orbit-path-3 {
            from { transform: rotate(180deg) translateX(110px) rotate(-180deg); }
            to { transform: rotate(540deg) translateX(110px) rotate(-540deg); }
          }
          @keyframes orbit-path-4 {
            from { transform: rotate(240deg) translateX(110px) rotate(-240deg); }
            to { transform: rotate(600deg) translateX(110px) rotate(-600deg); }
          }
          @keyframes orbit-path-5 {
            from { transform: rotate(300deg) translateX(110px) rotate(-300deg); }
            to { transform: rotate(660deg) translateX(110px) rotate(-660deg); }
          }
        }
      `}</style>

      {/* Title - with z-index to stay above orbit */}
      <h2 className="text-lg md:text-2xl font-bold text-gray-900 mb-3 md:mb-4 text-center search-title relative z-30 px-2">
        Deep search on{" "}
        <span className="text-[#0087FF]">{searchQuery || "..."}</span>
      </h2>

      {/* Source Logos */}
      <div className="flex items-center justify-center gap-1.5 md:gap-2 mb-6 md:mb-8 flex-wrap relative z-30 px-4">
        {SOURCE_LOGO_PATHS.map((logo, index) => (
          <div
            key={index}
            className="w-[22px] h-[22px] md:w-[26px] md:h-[26px] rounded-full bg-gray-100 flex items-center justify-center overflow-hidden shadow-sm"
          >
            <Image
              src={logo}
              alt={`Source ${index + 1}`}
              width={16}
              height={16}
              className="w-[12px] h-[12px] md:w-[16px] md:h-[16px] object-contain"
            />
          </div>
        ))}
        <span className="text-[10px] md:text-xs text-gray-500 bg-gray-100 px-2 py-0.5 md:py-1 rounded-full ml-1">
          +5 more
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-xs md:max-w-sm mb-4 md:mb-6 px-4 relative z-30">
        <div className="h-1.5 md:h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-[#0087FF] to-[#00B4FF] rounded-full transition-all duration-100 ease-linear"
            style={{ width: `${Math.min(progress * 0.95, 95)}%` }} // Never reaches 100%
          />
        </div>
      </div>

      {/* Progress Steps */}
      <div className="w-full max-w-xs md:max-w-sm space-y-2 md:space-y-3 mb-6 md:mb-8 px-4 relative z-30">
        {PROGRESS_STEPS.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isLastStep = index === PROGRESS_STEPS.length - 1;

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
                  <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-[#0087FF] flex items-center justify-center shadow-sm">
                    <Check className="w-3 h-3 md:w-3.5 md:h-3.5 text-white" strokeWidth={3} />
                  </div>
                ) : isCurrent && isLastStep ? (
                  <div className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 md:w-5 md:h-5 text-[#0087FF] animate-spin" />
                  </div>
                ) : isCurrent ? (
                  <div className="w-5 h-5 md:w-6 md:h-6 rounded-full border-2 border-[#0087FF] bg-[#0087FF]/10" />
                ) : (
                  <div className="w-5 h-5 md:w-6 md:h-6 rounded-full border-2 border-gray-200" />
                )}
              </div>
              {/* Text */}
              <span
                className={`text-xs md:text-sm transition-colors duration-300 ${
                  isCompleted
                    ? "text-gray-700"
                    : isCurrent
                    ? "text-[#0087FF] font-medium"
                    : "text-gray-400"
                }`}
              >
                {step.text}
              </span>
            </div>
          );
        })}
      </div>

      {/* Testimonial Card */}
      <div className="w-full max-w-xs md:max-w-sm bg-gradient-to-br from-gray-50 to-white rounded-2xl p-4 md:p-5 shadow-sm border border-gray-100 relative min-h-[120px] md:min-h-[140px] mx-4 z-30">
        {/* Crossfade testimonials */}
        {TESTIMONIALS.map((testimonial, index) => (
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
                  className="w-3.5 h-3.5 md:w-4 md:h-4 fill-[#0087FF] text-[#0087FF]"
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
        {TESTIMONIALS.map((_, index) => (
          <div
            key={index}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              index === currentTestimonial
                ? "bg-[#0087FF] w-4"
                : "bg-gray-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

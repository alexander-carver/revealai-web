"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Instagram, Linkedin } from "lucide-react";
import Image from "next/image";

interface Screen3Props {
  onContinue: () => void;
}

/**
 * Screen 3: "Dive Deeper into People" - Orbit Animation Demo
 *
 * Features:
 * - Keyhole view with avatar and "Explore Now" button
 * - Transition to orbit view with animated items
 * - Items: Biography, Friends, Instagram, LinkedIn, Career, Photos, Spotify, Relationships
 * - Center avatar with orbiting information badges
 */
export function Screen3({ onContinue }: Screen3Props) {
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    // Animation timeline:
    // Phase 0: Keyhole with avatar
    // Phase 1: Explore Now button appears (600ms)
    // Phase 2: Button ripple effect (1200ms)
    // Phase 3: Keyhole fades, avatar centers (1800ms)
    // Phase 4: Orbit items start appearing (2400ms)
    // Phase 5: All items visible, orbiting (3200ms)

    const timers = [
      setTimeout(() => setAnimationPhase(1), 600),
      setTimeout(() => setAnimationPhase(2), 1200),
      setTimeout(() => setAnimationPhase(3), 1800),
      setTimeout(() => setAnimationPhase(4), 2400),
      setTimeout(() => setAnimationPhase(5), 3200),
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Card Area */}
      <div className="flex-1 flex items-center justify-center px-6 pt-8">
        <div className="w-full max-w-sm bg-[#f5f5f5] rounded-3xl p-6 shadow-sm min-h-[400px] flex items-center justify-center relative overflow-hidden">
          {animationPhase < 3 ? (
            // Keyhole View
            <div className="flex flex-col items-center">
              {/* Keyhole Shape */}
              <div className="relative w-32 h-44">
                {/* Keyhole outline */}
                <svg viewBox="0 0 100 140" className="w-full h-full">
                  <defs>
                    <clipPath id="keyhole">
                      <circle cx="50" cy="35" r="30" />
                      <polygon points="30,55 70,55 60,140 40,140" />
                    </clipPath>
                  </defs>
                  <g clipPath="url(#keyhole)">
                    <rect width="100" height="140" fill="#e5e5e5" />
                  </g>
                </svg>
                {/* Avatar inside keyhole */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full overflow-hidden">
                  <Image
                    src="/person-3-avatar.png"
                    alt="Profile"
                    width={56}
                    height={56}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Explore Now Button */}
              <div className={`mt-6 transition-all duration-500 ${animationPhase >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                <div className={`bg-white px-6 py-2 rounded-full shadow-sm font-medium text-gray-700 ${
                  animationPhase >= 2 ? 'animate-pulse' : ''
                }`}>
                  Explore Now
                </div>
              </div>
            </div>
          ) : (
            // Orbit View
            <div className="relative w-full h-[280px] sm:h-[320px] flex items-center justify-center">
              {/* Center Avatar */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden z-10 shadow-lg">
                <Image
                  src="/person-3-avatar.png"
                  alt="Profile"
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Orbit Items - evenly distributed around the circle */}
              {animationPhase >= 4 && (
                <div className="absolute inset-0 onboarding-orbit-container">
                  {/* Biography - top (0 degrees) */}
                  <div className="onboarding-orbit-item" style={{ '--angle': '0deg' } as React.CSSProperties}>
                    <div className={`bg-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-md flex items-center gap-1 transition-all duration-500 ${animationPhase >= 5 ? 'opacity-100' : 'opacity-0'}`}>
                      <span className="text-xs sm:text-sm">📖</span>
                      <span className="text-xs sm:text-sm font-medium">Biography</span>
                    </div>
                  </div>

                  {/* Friends (45 degrees) */}
                  <div className="onboarding-orbit-item" style={{ '--angle': '45deg' } as React.CSSProperties}>
                    <div className={`bg-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-md flex items-center gap-1 transition-all duration-500 ${animationPhase >= 5 ? 'opacity-100' : 'opacity-0'}`}>
                      <span className="text-xs sm:text-sm">👥</span>
                      <span className="text-xs sm:text-sm font-medium">Friends</span>
                    </div>
                  </div>

                  {/* Instagram (90 degrees) */}
                  <div className="onboarding-orbit-item" style={{ '--angle': '90deg' } as React.CSSProperties}>
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center shadow-md transition-all duration-500 ${animationPhase >= 5 ? 'opacity-100' : 'opacity-0'}`}>
                      <Instagram className="w-3 h-3 sm:w-4 sm:h-4" />
                    </div>
                  </div>

                  {/* LinkedIn (135 degrees) */}
                  <div className="onboarding-orbit-item" style={{ '--angle': '135deg' } as React.CSSProperties}>
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#0077B5] flex items-center justify-center shadow-md transition-all duration-500 ${animationPhase >= 5 ? 'opacity-100' : 'opacity-0'}`}>
                      <Linkedin className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    </div>
                  </div>

                  {/* Career (180 degrees) */}
                  <div className="onboarding-orbit-item" style={{ '--angle': '180deg' } as React.CSSProperties}>
                    <div className={`bg-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-md flex items-center gap-1 transition-all duration-500 ${animationPhase >= 5 ? 'opacity-100' : 'opacity-0'}`}>
                      <span className="text-xs sm:text-sm">💼</span>
                      <span className="text-xs sm:text-sm font-medium">Career</span>
                    </div>
                  </div>

                  {/* Photos (225 degrees) */}
                  <div className="onboarding-orbit-item" style={{ '--angle': '225deg' } as React.CSSProperties}>
                    <div className={`bg-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-md flex items-center gap-1 transition-all duration-500 ${animationPhase >= 5 ? 'opacity-100' : 'opacity-0'}`}>
                      <span className="text-xs sm:text-sm">📷</span>
                      <span className="text-xs sm:text-sm font-medium">Photos</span>
                    </div>
                  </div>

                  {/* Spotify (270 degrees) */}
                  <div className="onboarding-orbit-item" style={{ '--angle': '270deg' } as React.CSSProperties}>
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#1DB954] flex items-center justify-center shadow-md transition-all duration-500 ${animationPhase >= 5 ? 'opacity-100' : 'opacity-0'}`}>
                      <span className="text-xs sm:text-sm">🎵</span>
                    </div>
                  </div>

                  {/* Relationships (315 degrees) */}
                  <div className="onboarding-orbit-item" style={{ '--angle': '315deg' } as React.CSSProperties}>
                    <div className={`bg-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-md flex items-center gap-1 transition-all duration-500 ${animationPhase >= 5 ? 'opacity-100' : 'opacity-0'}`}>
                      <span className="text-xs sm:text-sm">❤️</span>
                      <span className="text-xs sm:text-sm font-medium whitespace-nowrap">Relationships</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Text & Button Area */}
      <div className="px-4 sm:px-6 pb-6 sm:pb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Dive Deeper into People
        </h1>
        <p className="text-gray-500 text-base sm:text-lg mb-6 sm:mb-8">
          Curious about friends, colleagues, or celebrities? Explore everything in one place!
        </p>

        {/* Pagination Dots */}
        <div className="flex justify-center gap-2 mb-4 sm:mb-6">
          <div className="w-2 h-2 rounded-full bg-gray-300" />
          <div className="w-2 h-2 rounded-full bg-gray-300" />
          <div className="w-2 h-2 rounded-full bg-gray-800" />
        </div>

        {/* Next Button */}
        <button
          onClick={onContinue}
          className="w-full py-3.5 sm:py-4 px-6 rounded-2xl flex items-center justify-center gap-2 font-semibold text-base sm:text-lg transition-all duration-300 bg-gray-900 text-white hover:bg-gray-800 border-2 border-blue-500 shadow-lg shadow-blue-500/50"
        >
          Next
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

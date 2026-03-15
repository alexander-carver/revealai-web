"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Instagram, Linkedin } from "lucide-react";
import Image from "next/image";

interface Screen1Props {
  onContinue: () => void;
}

/**
 * Screen 1: "Unlock the Full Picture" - Sarah Johnson Demo
 *
 * Features:
 * - Animated photo reveal (3 photos of Sarah)
 * - Sources section with Instagram, LinkedIn, Bumble, Tinder cards
 * - Progressive animation sequence
 */
export function Screen1({ onContinue }: Screen1Props) {
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    // Animation timeline:
    // Phase 0: Initial state (just title + name faded)
    // Phase 1: First photo appears (500ms)
    // Phase 2: Second photo appears (1000ms)
    // Phase 3: Third photo appears (1500ms)
    // Phase 4: Sources header appears (2000ms)
    // Phase 5: Instagram appears (2300ms)
    // Phase 6: LinkedIn appears (2600ms)
    // Phase 7: Bumble appears (2900ms)
    // Phase 8: Tinder appears (3200ms)

    const timers = [
      setTimeout(() => setAnimationPhase(1), 500),
      setTimeout(() => setAnimationPhase(2), 1000),
      setTimeout(() => setAnimationPhase(3), 1500),
      setTimeout(() => setAnimationPhase(4), 2000),
      setTimeout(() => setAnimationPhase(5), 2300),
      setTimeout(() => setAnimationPhase(6), 2600),
      setTimeout(() => setAnimationPhase(7), 2900),
      setTimeout(() => setAnimationPhase(8), 3200),
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Card Area */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 pt-6 sm:pt-8">
        <div className="w-full max-w-sm bg-[#f5f5f5] rounded-3xl p-4 sm:p-6 shadow-sm min-h-[340px] sm:min-h-[380px]">
          {/* Title */}
          <div className="mb-3 sm:mb-4">
            <span className="text-lg sm:text-xl font-semibold text-gray-800">Tell me everything </span>
            <span className="text-lg sm:text-xl text-gray-400">about</span>
            <div className={`text-lg sm:text-xl font-semibold transition-all duration-500 ${animationPhase >= 1 ? 'text-gray-800' : 'text-gray-400'}`}>
              Sarah Johnson
            </div>
          </div>

          {/* Photos Row */}
          <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6">
            {/* Photo 1 */}
            <div className={`w-20 h-24 sm:w-24 sm:h-28 rounded-xl overflow-hidden transition-all duration-500 ${animationPhase >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
              <Image
                src="/sarah-1.png"
                alt="Sarah Johnson"
                width={96}
                height={112}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Photo 2 */}
            <div className={`w-24 h-28 sm:w-28 sm:h-32 rounded-xl overflow-hidden transition-all duration-500 ${animationPhase >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
              <Image
                src="/sarah-2.png"
                alt="Sarah Johnson"
                width={112}
                height={128}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Photo 3 */}
            <div className={`w-16 h-24 sm:w-20 sm:h-28 rounded-xl overflow-hidden transition-all duration-500 ${animationPhase >= 3 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
              <Image
                src="/sarah-3.png"
                alt="Sarah Johnson"
                width={80}
                height={112}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Sources Section */}
          <div className={`transition-all duration-500 ${animationPhase >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Sources</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Instagram */}
              <div className={`bg-white rounded-xl p-3 transition-all duration-300 ${animationPhase >= 5 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center">
                    <Instagram className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm font-medium">Instagram</span>
                </div>
                <div className="space-y-1">
                  <div className="h-2 bg-gray-200 rounded-full w-full" />
                  <div className="h-2 bg-gray-200 rounded-full w-3/4" />
                </div>
              </div>

              {/* LinkedIn */}
              <div className={`bg-white rounded-xl p-3 transition-all duration-300 ${animationPhase >= 6 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded bg-[#0077B5] flex items-center justify-center">
                    <Linkedin className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm font-medium">LinkedIn</span>
                </div>
                <div className="space-y-1">
                  <div className="h-2 bg-gray-200 rounded-full w-full" />
                  <div className="h-2 bg-gray-200 rounded-full w-2/3" />
                </div>
              </div>

              {/* Bumble */}
              <div className={`bg-white rounded-xl p-3 transition-all duration-300 ${animationPhase >= 7 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-[#FFC629] flex items-center justify-center">
                    <span className="text-xs">🐝</span>
                  </div>
                  <span className="text-sm font-medium">Bumble</span>
                </div>
                <div className="mt-2 h-2 bg-gray-200 rounded-full w-1/2" />
              </div>

              {/* Tinder */}
              <div className={`bg-white rounded-xl p-3 transition-all duration-300 ${animationPhase >= 8 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-gradient-to-br from-[#FD297B] to-[#FF5864] flex items-center justify-center">
                    <span className="text-xs">🔥</span>
                  </div>
                  <span className="text-sm font-medium">Tinder</span>
                </div>
                <div className="mt-2 h-2 bg-gray-200 rounded-full w-1/2" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Text & Button Area */}
      <div className="px-4 sm:px-6 pb-6 sm:pb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Unlock the Full Picture of Anyone Online
        </h1>
        <p className="text-gray-500 text-base sm:text-lg mb-6 sm:mb-8">
          Discover social media profiles, photos, videos, and professional details instantly!
        </p>

        {/* Pagination Dots */}
        <div className="flex justify-center gap-2 mb-4 sm:mb-6">
          <div className="w-2 h-2 rounded-full bg-gray-800" />
          <div className="w-2 h-2 rounded-full bg-gray-300" />
          <div className="w-2 h-2 rounded-full bg-gray-300" />
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

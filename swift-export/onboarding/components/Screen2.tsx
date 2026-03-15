"use client";

import { ArrowRight, Instagram, Linkedin, X } from "lucide-react";
import Image from "next/image";

interface Screen2Props {
  onContinue: () => void;
}

/**
 * Screen 2: "Explore New Connections" - Sean Combs Demo
 *
 * Features:
 * - Profile card with avatar and name badge
 * - Bio text with CSS fade-in animation
 * - Social media icons (Instagram, X/Twitter, LinkedIn, Facebook)
 */
export function Screen2({ onContinue }: Screen2Props) {
  return (
    <div className="flex flex-col h-full">
      {/* Card Area */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 pt-6 sm:pt-8">
        <div className="w-full max-w-sm bg-[#f5f5f5] rounded-3xl p-4 sm:p-6 shadow-sm min-h-[340px] sm:min-h-[380px] flex flex-col justify-center">
          {/* Full Profile View - single render, CSS animations handle the reveal */}
          <div className="flex flex-col">
            {/* Avatar + Name Badge */}
            <div className="flex items-center gap-2 mb-3 opacity-0 animate-[onboarding-fade_0.4s_ease-out_0.2s_forwards]">
              <div className="w-8 h-8 rounded-full overflow-hidden">
                <Image
                  src="/sean-avatar.png"
                  alt="Sean Combs"
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="bg-white px-3 py-1 rounded-full text-sm font-medium shadow-sm">Sean Combs</span>
            </div>

            {/* Bio */}
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed mb-4 opacity-0 animate-[onboarding-fade_0.4s_ease-out_0.6s_forwards]">
              Sean Combs is a 28-year-old professional currently living in Seattle, Washington. Originally from Austin, Texas, he moved to Seattle to pursue both career opportunities and his love for the vibrant culture of the Pacific Northwest.
            </p>

            {/* Social Icons */}
            <div className="flex gap-3 opacity-0 animate-[onboarding-fade_0.4s_ease-out_1s_forwards]">
              <div className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center bg-white">
                <Instagram className="w-4 h-4" />
              </div>
              <div className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center bg-white">
                <X className="w-4 h-4" />
              </div>
              <div className="w-8 h-8 rounded-lg bg-[#0077B5] flex items-center justify-center">
                <Linkedin className="w-4 h-4 text-white" />
              </div>
              <div className="w-8 h-8 rounded-lg bg-[#1877F2] flex items-center justify-center">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Text & Button Area */}
      <div className="px-4 sm:px-6 pb-6 sm:pb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Explore New Connections
        </h1>
        <p className="text-gray-500 text-base sm:text-lg mb-6 sm:mb-8">
          Just met someone? Reveal AI helps you check their online presence fast!
        </p>

        {/* Pagination Dots */}
        <div className="flex justify-center gap-2 mb-4 sm:mb-6">
          <div className="w-2 h-2 rounded-full bg-gray-300" />
          <div className="w-2 h-2 rounded-full bg-gray-800" />
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

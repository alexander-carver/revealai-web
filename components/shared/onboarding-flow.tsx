"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowRight, Search, Instagram, Linkedin, Users, Heart, Briefcase, Camera, BookOpen, X } from "lucide-react";
import Image from "next/image";

// ============================================
// TYPES
// ============================================
type OnboardingStep = 1 | 2 | 3;

interface OnboardingFlowProps {
  onComplete: () => void;
}

// ============================================
// SCREEN 1: Unlock the Full Picture
// ============================================
function Screen1({ onContinue }: { onContinue: () => void }) {
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
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

// ============================================
// SCREEN 2: Explore New Connections
// ============================================
function Screen2({ onContinue }: { onContinue: () => void }) {
  // No need for canContinue state - button always enabled

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

// ============================================
// SCREEN 3: Dive Deeper into People
// ============================================
function Screen3({ onContinue }: { onContinue: () => void }) {
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
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

  const orbitItems = [
    { icon: "📖", label: "Biography", angle: 0 },
    { icon: "🔥", label: "", angle: 45 }, // Tinder
    { icon: "👥", label: "Friends", angle: 72 },
    { icon: "📸", label: "", angle: 110 }, // Instagram icon
    { icon: "💼", label: "", angle: 144 }, // LinkedIn icon
    { icon: "💼", label: "Career", angle: 180 },
    { icon: "📷", label: "Photos", angle: 216 },
    { icon: "🎵", label: "", angle: 260 }, // Spotify
    { icon: "❤️", label: "Relationships", angle: 300 },
  ];

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
                  {/* Biography - top */}
                  <div className="onboarding-orbit-item" style={{ '--angle': '0deg' } as React.CSSProperties}>
                    <div className={`bg-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-md flex items-center gap-1 transition-all duration-500 ${animationPhase >= 5 ? 'opacity-100' : 'opacity-0'}`}>
                      <span className="text-xs sm:text-sm">📖</span>
                      <span className="text-xs sm:text-sm font-medium">Biography</span>
                    </div>
                  </div>

                  {/* Friends */}
                  <div className="onboarding-orbit-item" style={{ '--angle': '45deg' } as React.CSSProperties}>
                    <div className={`bg-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-md flex items-center gap-1 transition-all duration-500 ${animationPhase >= 5 ? 'opacity-100' : 'opacity-0'}`}>
                      <span className="text-xs sm:text-sm">👥</span>
                      <span className="text-xs sm:text-sm font-medium">Friends</span>
                    </div>
                  </div>

                  {/* Instagram */}
                  <div className="onboarding-orbit-item" style={{ '--angle': '90deg' } as React.CSSProperties}>
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center shadow-md transition-all duration-500 ${animationPhase >= 5 ? 'opacity-100' : 'opacity-0'}`}>
                      <Instagram className="w-3 h-3 sm:w-4 sm:h-4" />
                    </div>
                  </div>

                  {/* LinkedIn */}
                  <div className="onboarding-orbit-item" style={{ '--angle': '135deg' } as React.CSSProperties}>
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#0077B5] flex items-center justify-center shadow-md transition-all duration-500 ${animationPhase >= 5 ? 'opacity-100' : 'opacity-0'}`}>
                      <Linkedin className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    </div>
                  </div>

                  {/* Career */}
                  <div className="onboarding-orbit-item" style={{ '--angle': '180deg' } as React.CSSProperties}>
                    <div className={`bg-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-md flex items-center gap-1 transition-all duration-500 ${animationPhase >= 5 ? 'opacity-100' : 'opacity-0'}`}>
                      <span className="text-xs sm:text-sm">💼</span>
                      <span className="text-xs sm:text-sm font-medium">Career</span>
                    </div>
                  </div>

                  {/* Photos */}
                  <div className="onboarding-orbit-item" style={{ '--angle': '225deg' } as React.CSSProperties}>
                    <div className={`bg-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-md flex items-center gap-1 transition-all duration-500 ${animationPhase >= 5 ? 'opacity-100' : 'opacity-0'}`}>
                      <span className="text-xs sm:text-sm">📷</span>
                      <span className="text-xs sm:text-sm font-medium">Photos</span>
                    </div>
                  </div>

                  {/* Spotify */}
                  <div className="onboarding-orbit-item" style={{ '--angle': '270deg' } as React.CSSProperties}>
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#1DB954] flex items-center justify-center shadow-md transition-all duration-500 ${animationPhase >= 5 ? 'opacity-100' : 'opacity-0'}`}>
                      <span className="text-xs sm:text-sm">🎵</span>
                    </div>
                  </div>

                  {/* Relationships */}
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

// ============================================
// SEARCH SCREEN
// ============================================
function SearchScreen({ onSearch }: { onSearch: (name: string) => void }) {
  const [searchValue, setSearchValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      onSearch(searchValue.trim());
    }
  };

  return (
    <div className="flex flex-col h-full items-center justify-center px-6 bg-[#f8f8f8]">
      {/* Logo/Title */}
      <h1 className="text-4xl font-bold text-gray-800 mb-12 tracking-tight">
        Reveal AI
      </h1>

      {/* Search Input */}
      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Enter full name to search"
            className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl text-lg border-0 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
            autoFocus
          />
        </div>
        {searchValue.trim() && (
          <button
            type="submit"
            className="w-full mt-4 py-4 bg-gray-900 text-white rounded-2xl font-semibold text-lg hover:bg-gray-800 transition-colors"
          >
            Search
          </button>
        )}
      </form>
    </div>
  );
}

// ============================================
// LOADING SCREEN
// ============================================
function LoadingScreen({ searchName, onComplete }: { searchName: string; onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    "Searching public records...",
    "Analyzing social profiles...",
    "Cross-referencing data...",
    "Compiling results...",
  ];

  useEffect(() => {
    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, 60);

    // Step transitions
    const stepTimers = [
      setTimeout(() => setCurrentStep(1), 800),
      setTimeout(() => setCurrentStep(2), 1600),
      setTimeout(() => setCurrentStep(3), 2400),
      setTimeout(() => onComplete(), 3200),
    ];

    return () => {
      clearInterval(progressInterval);
      stepTimers.forEach(clearTimeout);
    };
  }, [onComplete]);

  return (
    <div className="flex flex-col h-full items-center justify-center px-6 bg-white">
      {/* Orbit Animation */}
      <div className="relative w-64 h-64 mb-8">
        {/* Center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
          <Search className="w-7 h-7 text-white" />
        </div>

        {/* Orbit Ring */}
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-gray-200 animate-spin-slow" />

        {/* Orbiting Items */}
        <div className="absolute inset-0">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="orbit-item absolute top-1/2 left-1/2 w-10 h-10 -mt-5 -ml-5"
              style={{ '--start-angle': `${i * 60}deg` } as React.CSSProperties}
            >
              <div className="w-10 h-10 rounded-full bg-white shadow-lg overflow-hidden">
                <Image
                  src={`/avatars/orbit-${i + 1}.png`}
                  alt=""
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search Name */}
      <h2 className="text-xl font-semibold text-gray-800 mb-2">
        Searching for {searchName}
      </h2>

      {/* Current Step */}
      <p className="text-gray-500 mb-6 h-6">{steps[currentStep]}</p>

      {/* Progress Bar */}
      <div className="w-full max-w-xs h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-100 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// ============================================
// MAIN ONBOARDING FLOW COMPONENT
// ============================================
export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);

  const handleScreen1Continue = () => setCurrentStep(2);
  const handleScreen2Continue = () => setCurrentStep(3);
  const handleScreen3Continue = () => {
    // Skip search and loading, go directly to completion
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white">
      <div className="h-full max-w-lg mx-auto">
        {currentStep === 1 && <Screen1 onContinue={handleScreen1Continue} />}
        {currentStep === 2 && <Screen2 onContinue={handleScreen2Continue} />}
        {currentStep === 3 && <Screen3 onContinue={handleScreen3Continue} />}
      </div>
    </div>
  );
}


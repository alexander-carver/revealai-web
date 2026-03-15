"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import Image from "next/image";

interface LoadingScreenProps {
  searchName: string;
  onComplete: () => void;
}

/**
 * Loading Screen - Shows search progress with orbit animation
 *
 * Features:
 * - Orbit animation with 6 avatars orbiting around center
 * - Progress bar
 * - Animated text showing current search step
 * - Auto-completes after ~3.2 seconds
 */
export function LoadingScreen({ searchName, onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    "Searching public records...",
    "Analyzing social profiles...",
    "Cross-referencing data...",
    "Compiling results...",
  ];

  useEffect(() => {
    // Progress animation - increments every 60ms
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, 60);

    // Step transitions at specific intervals
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
        {/* Center - Search icon */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
          <Search className="w-7 h-7 text-white" />
        </div>

        {/* Orbit Ring - dashed border that spins */}
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-gray-200 animate-spin-slow" />

        {/* Orbiting Items - 6 avatars positioned at different angles */}
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

      {/* Search Name Display */}
      <h2 className="text-xl font-semibold text-gray-800 mb-2">
        Searching for {searchName}
      </h2>

      {/* Current Step Text */}
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

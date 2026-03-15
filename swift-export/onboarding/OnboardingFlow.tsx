"use client";

import { useState } from "react";
import { Screen1 } from "./components/Screen1";
import { Screen2 } from "./components/Screen2";
import { Screen3 } from "./components/Screen3";

// ============================================
// TYPES
// ============================================

type OnboardingStep = 1 | 2 | 3;

interface OnboardingFlowProps {
  /** Called when the user completes all onboarding steps */
  onComplete: () => void;
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * OnboardingFlow - Full-screen onboarding experience
 *
 * Flow:
 * 1. Screen1: "Unlock the Full Picture" - Sarah Johnson demo with photo reveal
 * 2. Screen2: "Explore New Connections" - Sean Combs profile demo
 * 3. Screen3: "Dive Deeper into People" - Orbit animation demo
 * → onComplete callback
 *
 * Each screen has:
 * - Demo card area (showing the feature)
 * - Title and description text
 * - Pagination dots (1, 2, 3)
 * - "Next" button with blue border shadow
 */
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

// ============================================
// EXPORTS
// ============================================

export { Screen1 } from "./components/Screen1";
export { Screen2 } from "./components/Screen2";
export { Screen3 } from "./components/Screen3";
export { SearchScreen } from "./components/SearchScreen";
export { LoadingScreen } from "./components/LoadingScreen";

export type { OnboardingFlowProps };

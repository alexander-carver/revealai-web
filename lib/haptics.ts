export type HapticFeedbackType =
  | "selection"
  | "impact"
  | "success"
  | "warning";

const HAPTIC_PATTERNS: Record<HapticFeedbackType, number | number[]> = {
  selection: 8,
  impact: 14,
  success: [10, 24, 16],
  warning: [18, 36, 18],
};

function shouldSkipHaptics() {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function triggerHapticFeedback(type: HapticFeedbackType = "selection") {
  if (shouldSkipHaptics()) return false;

  const vibrate = navigator.vibrate?.bind(navigator);
  if (!vibrate) return false;

  try {
    return vibrate(HAPTIC_PATTERNS[type]);
  } catch {
    return false;
  }
}

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useSubscription } from "./use-subscription";

interface UseSearchLoadingOptions {
  // The minimum duration to show the loading screen (in ms)
  minLoadingDuration?: number;
  // Callback when search completes and should show results
  onComplete?: () => void;
  // Callback when loading is cancelled (user dismisses paywall without subscribing)
  onCancel?: () => void;
}

interface UseSearchLoadingReturn {
  // Whether the loading screen is visible
  isLoadingScreenVisible: boolean;
  // The search query being displayed
  searchQuery: string;
  // Start the loading screen with a query
  startLoading: (query: string) => void;
  // Called when loading animation completes - will show paywall or results
  completeLoading: () => void;
  // Called when user cancels (dismisses paywall without subscribing)
  cancelLoading: () => void;
  // Whether the actual search has completed (data is ready)
  isSearchComplete: boolean;
  // Mark the search as complete (data fetched successfully)
  setSearchComplete: (complete: boolean) => void;
}

export function useSearchLoading(
  options: UseSearchLoadingOptions = {}
): UseSearchLoadingReturn {
  const { minLoadingDuration = 12000, onComplete, onCancel } = options;
  const { isPro, showPaywall, isPaywallVisible } = useSubscription();

  const [isLoadingScreenVisible, setIsLoadingScreenVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchComplete, setIsSearchComplete] = useState(false);
  const [hasShownPaywall, setHasShownPaywall] = useState(false);

  const loadingStartTime = useRef<number | null>(null);
  const hasCompletedRef = useRef(false);

  // Start showing the loading screen
  const startLoading = useCallback((query: string) => {
    setSearchQuery(query);
    setIsLoadingScreenVisible(true);
    setIsSearchComplete(false);
    setHasShownPaywall(false);
    hasCompletedRef.current = false;
    loadingStartTime.current = Date.now();
  }, []);

  // Complete the loading (called after 12 seconds from SearchLoadingScreen)
  const completeLoading = useCallback(() => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;

    if (isPro) {
      // Pro user - hide loading screen and show results
      setIsLoadingScreenVisible(false);
      onComplete?.();
    } else {
      // Non-pro user - show paywall (loading screen stays visible behind it)
      setHasShownPaywall(true);
      showPaywall();
    }
  }, [isPro, showPaywall, onComplete]);

  // Cancel the loading (user dismissed paywall without subscribing)
  const cancelLoading = useCallback(() => {
    setIsLoadingScreenVisible(false);
    setSearchQuery("");
    setIsSearchComplete(false);
    setHasShownPaywall(false);
    hasCompletedRef.current = false;
    onCancel?.();
  }, [onCancel]);

  // Watch for paywall visibility changes
  useEffect(() => {
    if (hasShownPaywall && !isPaywallVisible) {
      if (isPro) {
        // User subscribed via paywall - show results
        setIsLoadingScreenVisible(false);
        onComplete?.();
      } else {
        // User dismissed paywall without subscribing - cancel
        cancelLoading();
      }
    }
  }, [isPaywallVisible, isPro, hasShownPaywall, onComplete, cancelLoading]);

  return {
    isLoadingScreenVisible,
    searchQuery,
    startLoading,
    completeLoading,
    cancelLoading,
    isSearchComplete,
    setSearchComplete: setIsSearchComplete,
  };
}


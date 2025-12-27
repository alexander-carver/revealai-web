"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useAuth } from "./use-auth";
import { supabase } from "@/lib/supabase/client";

export type SubscriptionTier = "free" | "weekly" | "yearly";

interface SubscriptionContextType {
  tier: SubscriptionTier;
  isPro: boolean;
  isLoading: boolean;
  showPaywall: () => void;
  hidePaywall: () => void;
  isPaywallVisible: boolean;
  showFreeTrialPaywall: () => void;
  hideFreeTrialPaywall: () => void;
  isFreeTrialPaywallVisible: boolean;
  checkAccess: (feature: string) => boolean;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined
);

// Features that require Pro subscription
const PRO_FEATURES = [
  "people_search",
  "records_search",
  "username_search",
  "vehicle_search",
  "privacy_tools",
  "unlimited_searches",
];

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [tier, setTier] = useState<SubscriptionTier>("free");
  const [isLoading, setIsLoading] = useState(false);
  const [isPaywallVisible, setIsPaywallVisible] = useState(false);
  const [isFreeTrialPaywallVisible, setIsFreeTrialPaywallVisible] = useState(false);

  const isPro = tier === "weekly" || tier === "yearly";

  const showPaywall = useCallback(() => {
    setIsPaywallVisible(true);
  }, []);

  const hidePaywall = useCallback(() => {
    setIsPaywallVisible(false);
  }, []);

  const showFreeTrialPaywall = useCallback(() => {
    setIsFreeTrialPaywallVisible(true);
  }, []);

  const hideFreeTrialPaywall = useCallback(() => {
    setIsFreeTrialPaywallVisible(false);
    // Mark free trial as dismissed so it doesn't show again
    localStorage.setItem("revealai_free_trial_dismissed", "true");
  }, []);

  const checkAccess = useCallback(
    (feature: string) => {
      if (!PRO_FEATURES.includes(feature)) return true;
      return isPro;
    },
    [isPro]
  );

  // Fetch subscription status from Supabase
  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setTier("free");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("tier, status, current_period_end")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle(); // Use maybeSingle instead of single to handle no results

      if (error && error.code !== "PGRST116") {
        // PGRST116 is "not found" - that's okay
        console.error("Error fetching subscription:", error);
      }

      if (data && data.status === "active") {
        // Check if subscription is still valid
        const periodEnd = new Date(data.current_period_end);
        if (periodEnd > new Date()) {
          setTier(data.tier as SubscriptionTier);
        } else {
          setTier("free");
        }
      } else {
        setTier("free");
      }
    } catch (err) {
      console.error("Subscription fetch error:", err);
      setTier("free");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const refreshSubscription = useCallback(async () => {
    await fetchSubscription();
  }, [fetchSubscription]);

  return (
    <SubscriptionContext.Provider
      value={{
        tier,
        isPro,
        isLoading,
        showPaywall,
        hidePaywall,
        isPaywallVisible,
        showFreeTrialPaywall,
        hideFreeTrialPaywall,
        isFreeTrialPaywallVisible,
        checkAccess,
        refreshSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider"
    );
  }
  return context;
}


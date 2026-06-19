"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "./use-auth";
import {
  getSearchProductBySearchType,
  type SearchProductId,
} from "@/lib/search-products";
import {
  getCanonicalSearchType,
  resolveSearchProductId,
} from "@/lib/search-routing";
import { getAuthHeaders, supabase } from "@/lib/supabase/client";
import { getDeviceId } from "@/lib/device-id";
import { isDeviceEmail } from "@/lib/subscription-reconciliation";

export type SubscriptionTier = "free" | "weekly" | "yearly";
export type AccessSource = "free" | "subscription" | "affiliate";
export type BillingProvider = "stripe" | "whop" | null;
export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "unpaid"
  | null;

interface SubscriptionContextType {
  tier: SubscriptionTier;
  accessSource: AccessSource;
  subscriptionStatus: SubscriptionStatus;
  billingProvider: BillingProvider;
  hasBillingIssue: boolean;
  hasSubscriptionRecord: boolean;
  isPro: boolean;
  isLoading: boolean;
  paywallProductId: SearchProductId;
  showPaywall: (productId?: SearchProductId) => void;
  hidePaywall: () => void;
  isPaywallVisible: boolean;
  showFreeTrialPaywall: (productId?: SearchProductId) => void;
  hideFreeTrialPaywall: () => void;
  isFreeTrialPaywallVisible: boolean;
  showFreeTrialPaywallDirectly: (productId?: SearchProductId) => void;
  showResultsPaywall: (productId?: SearchProductId) => void;
  hideResultsPaywall: () => void;
  isResultsPaywallVisible: boolean;
  showAbandonedPaywall: (productId?: SearchProductId) => void;
  hideAbandonedPaywall: () => void;
  isAbandonedPaywallVisible: boolean;
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

function inferPaywallProductId(
  pathname: string,
  searchType?: string | null,
  productParam?: string | null
): SearchProductId {
  const explicitProduct = resolveSearchProductId(productParam);
  if (explicitProduct) {
    return explicitProduct;
  }

  if (pathname.startsWith("/search/result")) {
    return getSearchProductBySearchType(
      getCanonicalSearchType(searchType ?? undefined) ?? searchType ?? undefined
    );
  }

  if (
    pathname.startsWith("/social") ||
    pathname.startsWith("/dating-app-search") ||
    pathname.startsWith("/username")
  ) {
    return "social";
  }

  if (
    pathname.startsWith("/followers") ||
    pathname.startsWith("/follower-search")
  ) {
    return "followers";
  }

  if (
    pathname.startsWith("/phone") ||
    pathname.startsWith("/reverse-phone-lookup")
  ) {
    return "phone";
  }

  if (
    pathname.startsWith("/vehicle") ||
    pathname.startsWith("/vehicle-lookup")
  ) {
    return "vehicle";
  }

  if (
    pathname.startsWith("/records") ||
    pathname.startsWith("/public-records-search")
  ) {
    return "records";
  }

  return "people";
}

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const reconciliationAttemptedForUserRef = useRef<string | null>(null);
  const [tier, setTier] = useState<SubscriptionTier>("free");
  const [accessSource, setAccessSource] = useState<AccessSource>("free");
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionStatus>(null);
  const [billingProvider, setBillingProvider] =
    useState<BillingProvider>(null);
  const [hasSubscriptionRecord, setHasSubscriptionRecord] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [paywallProductId, setPaywallProductId] =
    useState<SearchProductId>("people");
  const [isPaywallVisible, setIsPaywallVisible] = useState(false);
  const [isFreeTrialPaywallVisible, setIsFreeTrialPaywallVisible] = useState(false);
  const [isResultsPaywallVisible, setIsResultsPaywallVisible] = useState(false);
  const [isAbandonedPaywallVisible, setIsAbandonedPaywallVisible] = useState(false);
  const resolveRoutePaywallProductId = useCallback(
    () =>
      inferPaywallProductId(
        pathname,
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("type") ??
              new URLSearchParams(window.location.search).get("searchType")
          : undefined,
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("product")
          : undefined
      ),
    [pathname]
  );

  const isPro = tier === "weekly" || tier === "yearly";
  const hasBillingIssue =
    subscriptionStatus === "past_due" || subscriptionStatus === "unpaid";

  const showPaywall = useCallback((productId?: SearchProductId) => {
    setPaywallProductId(productId ?? resolveRoutePaywallProductId());
    setIsPaywallVisible(true);
  }, [resolveRoutePaywallProductId]);

  const hidePaywall = useCallback(() => {
    setIsPaywallVisible(false);
  }, []);

  const showFreeTrialPaywall = useCallback((productId?: SearchProductId) => {
    // Show main paywall instead of the legacy annual-offer modal.
    setPaywallProductId(productId ?? resolveRoutePaywallProductId());
    setIsPaywallVisible(true);
  }, [resolveRoutePaywallProductId]);

  const showFreeTrialPaywallDirectly = useCallback((productId?: SearchProductId) => {
    // Directly show the annual-offer modal.
    setPaywallProductId(productId ?? resolveRoutePaywallProductId());
    setIsFreeTrialPaywallVisible(true);
  }, [resolveRoutePaywallProductId]);

  const hideFreeTrialPaywall = useCallback(() => {
    setIsFreeTrialPaywallVisible(false);
    // Mark free trial as dismissed so it doesn't show again
    localStorage.setItem("revealai_free_trial_dismissed", "true");
  }, []);

  const showResultsPaywall = useCallback((productId?: SearchProductId) => {
    setPaywallProductId(productId ?? resolveRoutePaywallProductId());
    setIsResultsPaywallVisible(true);
  }, [resolveRoutePaywallProductId]);

  const hideResultsPaywall = useCallback(() => {
    setIsResultsPaywallVisible(false);
  }, []);

  const showAbandonedPaywall = useCallback((productId?: SearchProductId) => {
    setPaywallProductId(productId ?? resolveRoutePaywallProductId());
    setIsAbandonedPaywallVisible(true);
  }, [resolveRoutePaywallProductId]);

  const hideAbandonedPaywall = useCallback(() => {
    setIsAbandonedPaywallVisible(false);
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
      reconciliationAttemptedForUserRef.current = null;
      setTier("free");
      setAccessSource("free");
      setSubscriptionStatus(null);
      setBillingProvider(null);
      setHasSubscriptionRecord(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const loadTrackedSubscription = async () => {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Subscription fetch timeout")), 5000)
        );

        const queryPromise = supabase
          .from("subscriptions")
          .select("tier, status, current_period_end, billing_provider")
          .eq("user_id", user.id)
          .maybeSingle();

        return (await Promise.race([queryPromise, timeoutPromise])) as any;
      };

      const loadAffiliateAccessGrant = async () => {
        return await supabase
          .from("affiliates")
          .select("status")
          .eq("user_id", user.id)
          .in("status", ["pending_onboarding", "active"])
          .maybeSingle();
      };

      // Add timeout to prevent infinite loading
      let { data, error } = await loadTrackedSubscription();

      if (error && error.code !== "PGRST116") {
        // PGRST116 is "not found" - that's okay
        console.error("Error fetching subscription:", error);
      }

      setSubscriptionStatus((data?.status as SubscriptionStatus) ?? null);
      setBillingProvider((data?.billing_provider as BillingProvider) ?? null);
      setHasSubscriptionRecord(Boolean(data));

      if (data && data.status === "active") {
        // Check if subscription is still valid
        const periodEnd = new Date(data.current_period_end);
        if (periodEnd > new Date()) {
          setTier(data.tier as SubscriptionTier);
          setAccessSource("subscription");
        } else {
          const { data: affiliateAccess } = await loadAffiliateAccessGrant();
          if (affiliateAccess) {
            setTier("yearly");
            setAccessSource("affiliate");
          } else {
            setTier("free");
            setAccessSource("free");
          }
        }
      } else {
        const { data: affiliateAccess } = await loadAffiliateAccessGrant();

        if (affiliateAccess) {
          // Affiliates get complimentary Pro access as soon as they onboard
          // into the creator program, even before Stripe Connect is finished.
          setTier("yearly");
          setAccessSource("affiliate");
          return;
        }

        const shouldAttemptReconciliation =
          !data &&
          user.email &&
          !isDeviceEmail(user.email) &&
          reconciliationAttemptedForUserRef.current !== user.id;

        if (shouldAttemptReconciliation) {
          reconciliationAttemptedForUserRef.current = user.id;

          try {
            const headers = await getAuthHeaders();
            const reconciliationEndpoints = [
              "/api/stripe/link-subscription",
              "/api/billing/link-subscription",
            ];

            for (const endpoint of reconciliationEndpoints) {
              const reconcileResponse = await fetch(endpoint, {
                method: "POST",
                headers,
                body: JSON.stringify({
                  deviceId: getDeviceId(),
                }),
              });
              const reconcileResult = await reconcileResponse
                .json()
                .catch(() => null);

              if (!reconcileResponse.ok) {
                console.error(
                  `Subscription reconciliation error from ${endpoint}:`,
                  reconcileResult?.error || reconcileResponse.statusText
                );
                continue;
              }

              if (reconcileResult?.manualReviewRecommended) {
                console.warn(
                  "Subscription reconciliation flagged manual review:",
                  reconcileResult.reason || "multiple access-granting subscriptions"
                );
              }

              if (reconcileResult?.success && reconcileResult?.reconciled) {
                const refreshedResult = await loadTrackedSubscription();
                data = refreshedResult.data;
                error = refreshedResult.error;

                if (data && data.status === "active") {
                  const periodEnd = new Date(data.current_period_end);
                  if (periodEnd > new Date()) {
                    setSubscriptionStatus(
                      (data.status as SubscriptionStatus) ?? null
                    );
                    setHasSubscriptionRecord(true);
                    setTier(data.tier as SubscriptionTier);
                    setAccessSource("subscription");
                    return;
                  }
                }
              }
            }
          } catch (reconcileError) {
            console.error(
              "Subscription reconciliation request failed:",
              reconcileError
            );
          }
        }

        setTier("free");
        setAccessSource("free");
      }
    } catch (err) {
      console.error("Subscription fetch error:", err);
      setTier("free");
      setAccessSource("free");
      setSubscriptionStatus(null);
      setBillingProvider(null);
      setHasSubscriptionRecord(false);
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
        accessSource,
        subscriptionStatus,
        billingProvider,
        hasBillingIssue,
        hasSubscriptionRecord,
        isPro,
        isLoading,
        paywallProductId,
        showPaywall,
        hidePaywall,
        isPaywallVisible,
        showFreeTrialPaywall,
        hideFreeTrialPaywall,
        isFreeTrialPaywallVisible,
        showFreeTrialPaywallDirectly,
        showResultsPaywall,
        hideResultsPaywall,
        isResultsPaywallVisible,
        showAbandonedPaywall,
        hideAbandonedPaywall,
        isAbandonedPaywallVisible,
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

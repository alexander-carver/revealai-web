"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSubscription } from "@/hooks/use-subscription";
import { useAuth } from "@/hooks/use-auth";
import { AbandonedPaywallModal } from "./abandoned-paywall-modal";

const CHECKOUT_RETURN_WINDOW_MS = 30 * 60 * 1000;
const CHECKOUT_RETURN_PENDING_KEY = "revealai_checkout_return_pending";

function hasRecentCheckoutIntent() {
  if (typeof window === "undefined") return false;

  const checkoutInitiated =
    localStorage.getItem("revealai_checkout_initiated") === "true";
  const timestampRaw = localStorage.getItem("revealai_checkout_timestamp");
  const timestamp = timestampRaw ? Number(timestampRaw) : 0;

  if (!checkoutInitiated || !Number.isFinite(timestamp) || timestamp <= 0) {
    return false;
  }

  return Date.now() - timestamp <= CHECKOUT_RETURN_WINDOW_MS;
}

function hasPendingCheckoutReturn() {
  if (typeof window === "undefined") return false;

  return sessionStorage.getItem(CHECKOUT_RETURN_PENDING_KEY) === "true";
}

function clearCheckoutIntent() {
  if (typeof window === "undefined") return;

  localStorage.removeItem("revealai_checkout_initiated");
  localStorage.removeItem("revealai_checkout_timestamp");
  sessionStorage.removeItem(CHECKOUT_RETURN_PENDING_KEY);
}

export function CheckoutReturnHandler() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const { isPro, refreshSubscription, showAbandonedPaywall } = useSubscription();

  useEffect(() => {
    const proParam = searchParams.get("pro");

    if (proParam === "true" && user) {
      refreshSubscription();
      clearCheckoutIntent();
      window.history.replaceState({}, "", "/");
    }
  }, [searchParams, user, refreshSubscription]);

  useEffect(() => {
    const markCheckoutReturnPending = () => {
      if (!hasRecentCheckoutIntent()) return;

      sessionStorage.setItem(CHECKOUT_RETURN_PENDING_KEY, "true");
    };

    window.addEventListener("pagehide", markCheckoutReturnPending);

    return () => {
      window.removeEventListener("pagehide", markCheckoutReturnPending);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (searchParams.get("canceled") === "true") return;

    if (isPro) {
      if (hasRecentCheckoutIntent() || hasPendingCheckoutReturn()) {
        clearCheckoutIntent();
      }
      return;
    }

    if (hasRecentCheckoutIntent() && !hasPendingCheckoutReturn()) {
      clearCheckoutIntent();
    }
  }, [searchParams, isPro]);

  useEffect(() => {
    const canceled = searchParams.get("canceled");

    if (canceled === "true" && hasRecentCheckoutIntent() && !isPro) {
      clearCheckoutIntent();
      showAbandonedPaywall();
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }

    if (isPro && hasRecentCheckoutIntent()) {
      clearCheckoutIntent();
    }
  }, [searchParams, isPro, showAbandonedPaywall]);

  useEffect(() => {
    const handleCheckoutReturn = () => {
      if (isPro) {
        clearCheckoutIntent();
        return;
      }

      if (!hasPendingCheckoutReturn()) return;

      if (!hasRecentCheckoutIntent()) {
        clearCheckoutIntent();
        return;
      }

      clearCheckoutIntent();
      showAbandonedPaywall();
    };

    const handlePageShow = () => handleCheckoutReturn();
    const handleFocus = () => handleCheckoutReturn();

    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("focus", handleFocus);
    handleCheckoutReturn();

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("focus", handleFocus);
    };
  }, [isPro, showAbandonedPaywall]);

  return <AbandonedPaywallModal />;
}

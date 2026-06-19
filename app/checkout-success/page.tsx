"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Loader2, AlertCircle } from "lucide-react";
import { identifyUser, trackPurchase } from "@/lib/analytics";
import { useAuth } from "@/hooks/use-auth";
import { getDeviceId } from "@/lib/device-id";
import { getBillingCustomerEmail } from "@/lib/customer-email";
import { supabase } from "@/lib/supabase/client";
import {
  getTrackedCheckoutPlan,
  getTrackedCheckoutValue,
  getWhopPurchaseEventId,
} from "@/lib/whop-tracking";

function CheckoutSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const sessionId = searchParams.get("session_id");
  const alreadySubscribed = searchParams.get("already_subscribed");
  const provider = searchParams.get("provider") || "stripe";
  const plan = searchParams.get("plan");
  const whopPaymentId =
    searchParams.get("payment_id") || searchParams.get("receipt_id");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [accountSetupEmailSent, setAccountSetupEmailSent] = useState(false);
  const hasVerified = useRef(false);
  const hasSentAccountSetupEmail = useRef(false);

  const wait = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const trackWhopConversion = ({
    membershipId,
    trackedPlan,
  }: {
    membershipId?: string | null;
    trackedPlan: string;
  }) => {
    if (!membershipId) return;

    const trackedValue = getTrackedCheckoutValue(trackedPlan);
    const purchaseStorageKey = `revealai_whop_purchase_${membershipId}`;

    try {
      if (!localStorage.getItem(purchaseStorageKey)) {
        trackPurchase({
          value: trackedValue,
          currency: "USD",
          transaction_id: membershipId,
          plan: trackedPlan,
          eventId: getWhopPurchaseEventId(membershipId),
          sendMetaPixel: false,
        });
        localStorage.setItem(purchaseStorageKey, new Date().toISOString());
      }
    } catch (analyticsError) {
      console.log("Whop analytics tracking failed, continuing anyway", analyticsError);
    }
  };

  const activateWhopSubscription = async () => {
    setStatus("loading");
    setErrorMessage(null);

    const trackedPlan = getTrackedCheckoutPlan(plan);

    for (let attempt = 0; attempt < 12; attempt += 1) {
      const response = await fetch("/api/checkout/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          paymentId: whopPaymentId,
          receiptId: searchParams.get("receipt_id") || undefined,
          userId: user?.id || undefined,
          email: user?.email || undefined,
          deviceId: getDeviceId(),
        }),
      });

      const result = await response.json();

      if (response.ok && result?.success) {
        localStorage.removeItem("revealai_checkout_initiated");
        localStorage.removeItem("revealai_checkout_timestamp");
        trackWhopConversion({
          membershipId:
            result.membershipId ||
            result.subscription?.whop_membership_id ||
            null,
          trackedPlan,
        });
        setEmail(result.email || user?.email || null);
        if (result.email || user?.email) {
          identifyUser(result.email || user?.email || undefined, user?.id);
        }
        setStatus("success");
        setTimeout(() => {
          router.push("/?pro=true");
        }, 2000);
        return;
      }

      await wait(2000);
    }

    setStatus("error");
    setErrorMessage(
      "Your payment went through, but access is still syncing. Refresh in a moment if it doesn't unlock automatically."
    );
  };

  const activateSubscription = async () => {
    if (provider === "whop") {
      await activateWhopSubscription();
      return;
    }

    // If user already had an active subscription, show success and redirect
    if (alreadySubscribed === "true") {
      console.log("User already has an active subscription, redirecting...");
      setStatus("success");
      setTimeout(() => {
        router.push("/?pro=true");
      }, 2000);
      return;
    }

    if (!sessionId) {
      setStatus("error");
      setErrorMessage("No session ID found. Please try again.");
      return;
    }

    console.log("🚀 Activating subscription for session:", sessionId);
    setStatus("loading");
    setErrorMessage(null);

    try {
      // Step 1: Verify with Stripe and create account + subscription
      const response = await fetch("/api/stripe/verify-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      const result = await response.json();
      console.log("✅ Verification result:", result);

      if (result.success) {
        // Clear checkout initiated flag since checkout succeeded
        localStorage.removeItem("revealai_checkout_initiated");
        localStorage.removeItem("revealai_checkout_timestamp");
        
        // Track purchase for analytics
        try {
          const sessionResponse = await fetch(`/api/stripe/session?session_id=${sessionId}`);
          const sessionData = await sessionResponse.json();
          if (sessionData.success) {
            trackPurchase({
              value: sessionData.value,
              currency: sessionData.currency,
              transaction_id: sessionData.transaction_id,
              plan: sessionData.plan,
              eventId: sessionData.event_id,
              sendMetaPixel: false,
            });
          }
        } catch (e) {
          console.log("Analytics tracking failed, continuing anyway");
        }

        setEmail(result.email);
        if (result.email) identifyUser(result.email, result.userId);
        setStatus("success");
        
        // Redirect to home after 2 seconds
        setTimeout(() => {
          router.push("/?pro=true");
        }, 2000);
      } else {
        console.error("❌ Verification failed:", result.error);
        setStatus("error");
        setErrorMessage(result.error || "Failed to activate subscription");
      }
    } catch (err: any) {
      console.error("❌ Error activating:", err);
      setStatus("error");
      setErrorMessage(err.message || "Something went wrong. Please try again.");
    }
  };

  // Auto-activate on page load
  useEffect(() => {
    if (hasVerified.current) return;
    hasVerified.current = true;
    activateSubscription();
  }, [sessionId, provider, user?.id, user?.email]);

  useEffect(() => {
    if (status !== "success" || hasSentAccountSetupEmail.current) {
      return;
    }

    const billingEmail = getBillingCustomerEmail(email);
    const currentUserBillingEmail = getBillingCustomerEmail(user?.email);

    if (!billingEmail || currentUserBillingEmail === billingEmail) {
      return;
    }

    hasSentAccountSetupEmail.current = true;

    supabase.auth
      .resetPasswordForEmail(billingEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      .then(({ error }) => {
        if (error) {
          console.error("Failed to send account setup email:", error);
          return;
        }

        setAccountSetupEmailSent(true);
      })
      .catch((resetError) => {
        console.error("Failed to send account setup email:", resetError);
      });
  }, [status, email, user?.email]);

  // Loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Activating your subscription...</h2>
            <p className="text-muted-foreground">
              This only takes a moment.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">You're all set!</h2>
            <p className="text-muted-foreground mb-4">
              Your Pro subscription is now active.
            </p>
            {email && (
              <p className="text-sm text-muted-foreground mb-6">
                Access linked to: <strong>{email}</strong>
              </p>
            )}
            {accountSetupEmailSent && email && (
              <p className="text-sm text-muted-foreground mb-4">
                We also sent a secure password setup email to <strong>{email}</strong>.
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Redirecting you now...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground mb-4">
            {errorMessage || "We couldn't activate your subscription."}
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Your payment may have succeeded, but access has not finished syncing yet.
          </p>
          <div className="space-y-3">
            <Button
              onClick={() =>
                provider === "whop" ? activateWhopSubscription() : router.push("/")
              }
              className="w-full"
            >
              {provider === "whop" ? "Retry Access Sync" : "Return to Homepage"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            If this keeps happening, email support@revealai-peoplesearch.com
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="p-8 text-center">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold">Loading...</h2>
            </CardContent>
          </Card>
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}

"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { trackPurchase } from "@/lib/analytics";

function CheckoutSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const hasVerified = useRef(false);

  const activateSubscription = async () => {
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
            });
          }
        } catch (e) {
          console.log("Analytics tracking failed, continuing anyway");
        }

        setEmail(result.email);
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
  }, [sessionId]);

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
                Account created for: <strong>{email}</strong>
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
            Don't worry - your payment was successful. Just click below to try again.
          </p>
          <div className="space-y-3">
            <Button 
              onClick={() => router.push("/")}
              className="w-full"
            >
              Return to Homepage
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

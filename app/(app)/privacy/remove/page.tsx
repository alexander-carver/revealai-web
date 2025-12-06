"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  EyeOff,
  ArrowLeft,
  Shield,
  Check,
  AlertCircle,
  Loader2,
  Crown,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { updateOptOutStatus } from "@/lib/services/privacy";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";

export default function RemoveFromSearchPage() {
  const { user } = useAuth();
  const { isPro, showPaywall, tier } = useSubscription();
  const [isOptedOut, setIsOptedOut] = useState(false);
  const [success, setSuccess] = useState(false);

  const optOutMutation = useMutation({
    mutationFn: async (optOut: boolean) => {
      if (!user) throw new Error("You must be signed in to use this feature");
      await updateOptOutStatus(user.id, optOut);
      return optOut;
    },
    onSuccess: (optOut) => {
      setIsOptedOut(optOut);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    },
  });

  const handleOptOut = () => {
    if (!isPro) {
      showPaywall();
      return;
    }

    if (!user) {
      return;
    }

    optOutMutation.mutate(!isOptedOut);
  };

  return (
    <div>
      {/* Back Button */}
      <div className="mb-6">
        <Link href="/privacy">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Privacy
          </Button>
        </Link>
      </div>

      <PageHeader
        title="Remove From Search"
        description="Control whether your profile appears in search results"
        icon={EyeOff}
        iconColor="text-rose-500"
        iconBgColor="bg-rose-500/10"
      />

      {!user && (
        <Alert variant="warning" className="mb-6">
          <AlertCircle className="w-4 h-4" />
          You must be signed in to manage your search visibility.
          <Link href="/login" className="ml-2 underline">
            Sign in
          </Link>
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="mb-6">
          <Check className="w-4 h-4" />
          Your preference has been saved successfully.
        </Alert>
      )}

      {optOutMutation.error && (
        <Alert variant="destructive" className="mb-6">
          {(optOutMutation.error as Error).message}
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search Visibility</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-xl bg-muted/50">
            <div className="flex items-start gap-4">
              <div
                className={`p-3 rounded-xl ${
                  isOptedOut ? "bg-success/10" : "bg-amber-500/10"
                }`}
              >
                {isOptedOut ? (
                  <Shield className="w-6 h-6 text-success" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-amber-500" />
                )}
              </div>
              <div>
                <h3 className="font-semibold">
                  {isOptedOut
                    ? "You are hidden from searches"
                    : "You are visible in searches"}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md">
                  {isOptedOut
                    ? "Your profile will not appear when others search for you on RevealAI."
                    : "Your profile may appear when others search for your name or contact information."}
                </p>
              </div>
            </div>

            <Button
              onClick={handleOptOut}
              disabled={!user || optOutMutation.isPending}
              variant={isOptedOut ? "outline" : "default"}
              className="gap-2"
            >
              {optOutMutation.isPending && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              {isOptedOut ? "Make Visible" : "Hide My Profile"}
            </Button>
          </div>

          <div className="mt-6 space-y-4">
            <h4 className="font-medium">What this means:</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                <span>
                  <strong>When opted out:</strong> Your profile will not appear
                  in people search results on RevealAI.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Processing time:</strong> Changes take effect within
                  24-48 hours.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Note:</strong> This only affects RevealAI searches.
                  Your data may still appear on other platforms.
                </span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Need More Protection?</h3>
              <p className="text-sm text-muted-foreground mt-1">
                To fully protect your privacy, you should also remove your data
                from major data brokers. We provide guides to help you through
                the process.
              </p>
              <Link href="/privacy/brokers" className="inline-block mt-4">
                <Button variant="outline" size="sm">
                  View Data Broker Removal Guides
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Section */}
      {user && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="w-5 h-5" />
              Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isPro ? (
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Crown className="w-8 h-8 text-amber-500" />
                    <div>
                      <p className="font-semibold">RevealAI Pro</p>
                      <p className="text-sm text-muted-foreground">
                        {tier === "weekly" ? "Weekly" : "Yearly"} plan
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={async () => {
                      try {
                        const response = await fetch("/api/stripe/customer-portal", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ userId: user.id }),
                        });
                        const data = await response.json();
                        if (data.url) {
                          window.location.href = data.url;
                        } else {
                          alert(data.error || "Failed to open customer portal");
                        }
                      } catch (error) {
                        console.error("Error opening customer portal:", error);
                        alert("Failed to open customer portal. Please try again.");
                      }
                    }}
                  >
                    Manage
                  </Button>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {[
                    "Unlimited searches",
                    "Full reports",
                    "Records access",
                    "Priority support",
                  ].map((feature) => (
                    <div
                      key={feature}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Check className="w-4 h-4 text-green-500" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-muted/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Free Plan</p>
                    <p className="text-sm text-muted-foreground">
                      Limited features
                    </p>
                  </div>
                  <Button
                    onClick={showPaywall}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade to Pro
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}


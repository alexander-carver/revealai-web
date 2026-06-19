"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Settings,
  User,
  CreditCard,
  LogOut,
  Mail,
  Lock,
  Crown,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import {
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/modal";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { getAuthHeaders } from "@/lib/supabase/client";

function SettingsContent() {
  const searchParams = useSearchParams();
  const { user, signOut, updatePassword } = useAuth();
  const {
    tier,
    accessSource,
    subscriptionStatus,
    billingProvider,
    hasBillingIssue,
    hasSubscriptionRecord,
    isPro,
    showPaywall,
    refreshSubscription,
  } = useSubscription();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOpeningBillingPortal, setIsOpeningBillingPortal] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const closePasswordModal = () => {
    setIsPasswordModalOpen(false);
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError(null);
  };

  const handleManageBilling = async () => {
    try {
      setErrorMessage(null);
      setIsOpeningBillingPortal(true);
      const headers = await getAuthHeaders();
      const response = await fetch("/api/billing/manage", {
        method: "POST",
        headers,
      });
      const result = await response.json();

      if (!response.ok || !result?.url) {
        throw new Error(result?.error || "Failed to open billing portal.");
      }

      window.location.href = result.url;
    } catch (error) {
      console.error("Billing portal error:", error);
      setErrorMessage(
        "We couldn't open billing settings right now. Please try again in a moment."
      );
    } finally {
      setIsOpeningBillingPortal(false);
    }
  };

  const handlePasswordUpdate = async () => {
    setPasswordError(null);
    setErrorMessage(null);

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setIsUpdatingPassword(true);
    const { error } = await updatePassword(newPassword);

    if (error) {
      setPasswordError(error.message);
      setIsUpdatingPassword(false);
      return;
    }

    setIsUpdatingPassword(false);
    closePasswordModal();
    setSuccessMessage("Password updated successfully.");
  };

  const billingStatusLabel =
    subscriptionStatus === "past_due"
      ? "Payment overdue"
      : subscriptionStatus === "unpaid"
      ? "Payment failed"
      : subscriptionStatus === "canceled"
      ? "Canceled"
      : null;

  // Handle checkout success (if redirected from success page)
  useEffect(() => {
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");
    const message = searchParams.get("message");
    
    if (success === "true") {
      setSuccessMessage("Subscription activated! Welcome to Pro!");
      // Refresh subscription status
      refreshSubscription();
      
      // Clear the success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
        // Clean up URL
        window.history.replaceState({}, "", "/settings");
      }, 5000);
    } else if (canceled === "true") {
      setSuccessMessage(message || "Your subscription has been canceled.");
      // Refresh subscription status
      refreshSubscription();
      
      // Clear the success message after 8 seconds
      setTimeout(() => {
        setSuccessMessage(null);
        // Clean up URL
        window.history.replaceState({}, "", "/settings");
      }, 8000);
    }
  }, [searchParams, refreshSubscription]);

  if (!user) {
    return (
      <div>
        <PageHeader
          title="Settings"
          description="Manage your account and preferences"
          icon={Settings}
          iconColor="text-muted-foreground"
          iconBgColor="bg-muted"
        />
        <Alert variant="info">
          <User className="w-4 h-4" />
          <div>
            Please{" "}
            <Link href="/login" className="underline font-medium">
              sign in
            </Link>{" "}
            to access your settings.
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your account and preferences"
        icon={Settings}
        iconColor="text-muted-foreground"
        iconBgColor="bg-muted"
      />

      {successMessage && (
        <Alert variant="success" className="mb-6">
          <Check className="w-4 h-4" />
          {successMessage}
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="w-4 h-4" />
          {errorMessage}
        </Alert>
      )}

      <div className="space-y-6">
        {/* Account Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5" />
              Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{user.email}</p>
                  <p className="text-sm text-muted-foreground">
                    Member since{" "}
                    {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {isPro && (
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                  <Crown className="w-3 h-3 mr-1" />
                  Pro
                </Badge>
              )}
            </div>

            <div className="grid gap-3">
              <SettingsItem
                icon={Mail}
                label="Email"
                value={user.email || "Not set"}
              />
              <SettingsItem
                icon={Lock}
                label="Password"
                value="••••••••"
                action={
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsPasswordModalOpen(true)}
                  >
                    Change
                  </Button>
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Subscription Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="w-5 h-5" />
              Subscription
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isPro ? (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="w-5 h-5 text-amber-500" />
                    <span className="font-semibold text-amber-500">
                      {accessSource === "affiliate" ? "Affiliate Access" : "Pro Member"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {accessSource === "affiliate"
                      ? "Your affiliate account includes complimentary Pro access."
                      : `You're on the ${tier === "weekly" ? "Weekly" : "Yearly"} plan`}
                  </p>
                </div>
                {accessSource === "subscription" && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleManageBilling}
                    disabled={isOpeningBillingPortal}
                  >
                    {isOpeningBillingPortal ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Opening Billing Portal...
                      </>
                    ) : (
                      billingProvider === "whop"
                        ? "Manage Subscription"
                        : "Manage Billing"
                    )}
                  </Button>
                )}
                {accessSource === "subscription" &&
                  billingProvider !== "whop" && (
                  <Link href="/settings/cancel">
                    <Button
                      variant="outline"
                      className="w-full"
                    >
                      Cancel Subscription
                    </Button>
                  </Link>
                )}
              </div>
            ) : hasBillingIssue ? (
              <div className="space-y-3">
                <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10">
                  <p className="font-medium text-amber-700">
                    {billingStatusLabel || "Billing issue detected"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {billingProvider === "whop"
                      ? "Your subscription hit a payment issue. Open your subscription settings to update billing details and restore access."
                      : "Your subscription hit a payment issue. Update your payment method to restore access and improve renewal success."}
                  </p>
                </div>
                <Button
                  onClick={handleManageBilling}
                  className="w-full gap-2"
                  disabled={isOpeningBillingPortal}
                >
                  {isOpeningBillingPortal ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Opening Billing Portal...
                    </>
                  ) : billingProvider === "whop" ? (
                    <>
                      <CreditCard className="w-4 h-4" />
                      Manage Subscription
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      Update Payment Method
                    </>
                  )}
                </Button>
              </div>
            ) : hasSubscriptionRecord ? (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-muted/50">
                  <p className="font-medium mb-1">
                    {billingStatusLabel || "Subscription inactive"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Your previous subscription isn&apos;t currently granting Pro
                    access.
                  </p>
                </div>
                <Button
                  onClick={handleManageBilling}
                  variant="outline"
                  className="w-full"
                  disabled={isOpeningBillingPortal}
                >
                  {isOpeningBillingPortal ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Opening Billing Portal...
                    </>
                  ) : billingProvider === "whop" ? (
                    "Manage Subscription"
                  ) : (
                    "Manage Billing"
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-muted/50">
                  <p className="font-medium mb-1">Free Plan</p>
                  <p className="text-sm text-muted-foreground">
                    Upgrade to Pro for unlimited searches and advanced features
                  </p>
                </div>
                <Button
                  onClick={() => showPaywall()}
                  className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                >
                  <Crown className="w-4 h-4" />
                  Upgrade to Pro
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Card>
          <CardContent className="p-4">
            <Button
              variant="destructive"
              onClick={() => signOut()}
              className="w-full gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>

      <Modal isOpen={isPasswordModalOpen} onClose={closePasswordModal}>
        <ModalHeader>
          <h3 className="text-2xl font-semibold text-gray-900">
            Change password
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose a new password for your account.
          </p>
        </ModalHeader>
        <ModalContent className="space-y-4">
          {passwordError ? (
            <Alert variant="destructive">{passwordError}</Alert>
          ) : null}
          <Input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            icon={<Lock className="w-4 h-4" />}
            minLength={6}
          />
          <Input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            icon={<Lock className="w-4 h-4" />}
            minLength={6}
          />
        </ModalContent>
        <ModalFooter>
          <Button variant="outline" onClick={closePasswordModal}>
            Cancel
          </Button>
          <Button onClick={handlePasswordUpdate} isLoading={isUpdatingPassword}>
            Update password
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

function SettingsItem({
  icon: Icon,
  label,
  value,
  action,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-border">
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">{value}</span>
        {action}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}

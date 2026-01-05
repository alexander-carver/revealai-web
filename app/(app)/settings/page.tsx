"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Settings,
  User,
  Bell,
  Shield,
  CreditCard,
  LogOut,
  Moon,
  Sun,
  Mail,
  Lock,
  ChevronRight,
  Crown,
  Check,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";

function SettingsContent() {
  const searchParams = useSearchParams();
  const { user, signOut } = useAuth();
  const { tier, isPro, showPaywall, refreshSubscription } = useSubscription();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Handle Stripe checkout success (if redirected from success page)
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

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark");
  };

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
                  <Button variant="ghost" size="sm">
                    Change
                  </Button>
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Preferences Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="w-5 h-5" />
              Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
              <div className="flex items-center gap-3">
                {isDarkMode ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5" />
                )}
                <div>
                  <p className="font-medium">Theme</p>
                  <p className="text-sm text-muted-foreground">
                    {isDarkMode ? "Dark mode" : "Light mode"}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={toggleTheme}>
                Toggle
              </Button>
            </div>

          </CardContent>
        </Card>

        {/* Notifications Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <NotificationToggle
                label="Email notifications"
                description="Receive updates about your searches"
                defaultChecked={true}
              />
              <NotificationToggle
                label="Security alerts"
                description="Get notified about account security"
                defaultChecked={true}
              />
              <NotificationToggle
                label="Marketing emails"
                description="Tips, updates, and offers"
                defaultChecked={false}
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
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-5 h-5 text-amber-500" />
                  <span className="font-semibold text-amber-500">Pro Member</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  You're on the {tier === "weekly" ? "Weekly" : "Yearly"} plan
                </p>
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
                  onClick={showPaywall}
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

function NotificationToggle({
  label,
  description,
  defaultChecked,
}: {
  label: string;
  description: string;
  defaultChecked: boolean;
}) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <button
        onClick={() => setChecked(!checked)}
        className={`relative w-12 h-7 rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </button>
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


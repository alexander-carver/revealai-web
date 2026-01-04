"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { trackPurchase } from "@/lib/analytics";

function CheckoutSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [isProcessing, setIsProcessing] = useState(true);
  const [subscriptionActive, setSubscriptionActive] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showManualActivation, setShowManualActivation] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasVerified = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check auth state directly from Supabase (don't rely on context after redirect)
  useEffect(() => {
    const checkAuth = async () => {
      console.log("Checking auth state...");
      
      // Try multiple times as session might take a moment to be available after redirect
      let attempts = 0;
      const maxAttempts = 3; // Reduced from 5 to be faster
      
      const tryGetSession = async (): Promise<any> => {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
        }
        
        if (session?.user) {
          console.log("Session found:", session.user.email);
          return session.user;
        }
        
        attempts++;
        if (attempts < maxAttempts) {
          console.log(`No session found, retrying... (${attempts}/${maxAttempts})`);
          await new Promise(resolve => setTimeout(resolve, 300));
          return tryGetSession();
        }
        
        console.log("No session found after all attempts - will try guest activation");
        return null;
      };
      
      const foundUser = await tryGetSession();
      setUser(foundUser);
      setAuthChecked(true);
    };

    checkAuth();

    // Show manual activation button after 10 seconds if still processing
    timeoutRef.current = setTimeout(() => {
      console.log("⚠️ Activation taking too long, showing manual button");
      setShowManualActivation(true);
    }, 10000);

    // Also listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed in checkout-success:", event, session?.user?.email);
      if (session?.user) {
        setUser(session.user);
        setAuthChecked(true);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Check subscription status and verify with Stripe
  useEffect(() => {
    if (!sessionId || !authChecked || hasVerified.current) {
      return;
    }

    // Allow processing even without user - we'll auto-create account
    hasVerified.current = true;
    console.log("Starting verification. User:", user?.id || "guest", "Email:", user?.email || "unknown");

    const verifyAndCreateSubscription = async () => {
      // First, verify the Stripe session and get payment details
      try {
        console.log("Fetching Stripe session details for purchase tracking...");
        const sessionResponse = await fetch(`/api/stripe/session?session_id=${sessionId}`);
        const sessionData = await sessionResponse.json();
        
        if (sessionData.success && sessionData.payment_status === 'paid') {
          console.log("✅ Payment verified:", sessionData);
          
          // Track the purchase event with verified Stripe data
          trackPurchase({
            value: sessionData.value,
            currency: sessionData.currency,
            transaction_id: sessionData.transaction_id,
            plan: sessionData.plan,
          });
        }
      } catch (err) {
        console.error("Error fetching session for analytics:", err);
        // Continue with subscription creation even if tracking fails
      }

      // Now create/verify subscription in our database
      try {
        console.log("Verifying Stripe session and creating subscription...");
        const response = await fetch("/api/stripe/verify-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId,
            userId: user?.id || null,
            email: user?.email || null,
          }),
        });

        const result = await response.json();
        console.log("Verify session result:", result);

        if (result.success) {
          console.log("✅ Subscription created successfully!");
          
          // Clear the timeout for manual activation
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          
          // If account was auto-created and we have an email, try to sign them in
          if (result.email && !user) {
            console.log("Account was auto-created, attempting sign-in for:", result.email);
            
            // Try to get session - might already be established if webhook created it
            const { data: { session: existingSession } } = await supabase.auth.getSession();
            if (existingSession?.user) {
              console.log("Session already exists, user is signed in!");
              setUser(existingSession.user);
            } else {
              console.log("No existing session, will redirect to home for manual sign-in");
            }
          }
          
          setSubscriptionActive(true);
          setIsProcessing(false);
          setError(null);
          setTimeout(() => {
            router.push("/?pro=true");
          }, 1000);
          return;
        } else {
          console.error("Verify session failed:", result.error);
          setError(result.error || "Failed to verify payment");
        }
      } catch (err: any) {
        console.error("Error verifying session:", err);
        setError(err.message || "Failed to verify payment");
      }

      // If verify-session didn't work and we have a user, poll the database
      if (user?.id) {
        let attempts = 0;
        const maxAttempts = 5; // 10 seconds total

        const poll = async () => {
          console.log(`Polling subscription... attempt ${attempts + 1}`);
          
          const { data, error: pollError } = await supabase
            .from("subscriptions")
            .select("tier, status, current_period_end")
            .eq("user_id", user.id)
            .eq("status", "active")
            .maybeSingle();

          if (pollError && pollError.code !== "PGRST116") {
            console.error("Error checking subscription:", pollError);
          }

          console.log("Subscription check result:", data);

          if (data && data.status === "active") {
            const periodEnd = new Date(data.current_period_end);
            if (periodEnd > new Date()) {
              console.log("✅ Subscription found in database!");
              setSubscriptionActive(true);
              setIsProcessing(false);
              setError(null);
              if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
              }
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
              }
              setTimeout(() => {
                router.push("/?pro=true");
              }, 1000);
              return true;
            }
          }

          attempts++;
          if (attempts >= maxAttempts) {
            console.log("⚠️ Max polling attempts reached");
            setIsProcessing(false);
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
            }
          }
          return false;
        };

        // Check immediately
        const found = await poll();
        if (!found) {
          pollIntervalRef.current = setInterval(poll, 2000);
        }
      } else {
        console.log("No user ID, skipping database polling");
        setIsProcessing(false);
      }
    };

    verifyAndCreateSubscription();

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [sessionId, user, authChecked, router]);

  // Manual activation function - defined before use
  const handleManualActivation = async () => {
    console.log("🔄 Manual activation triggered by user");
    setIsProcessing(true);
    setShowManualActivation(false);
    hasVerified.current = false; // Reset to allow re-verification
    
    // Clear timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (!sessionId) return;
    
    try {
      const response = await fetch("/api/stripe/verify-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          userId: user?.id || null,
          email: user?.email || null,
        }),
      });

      const result = await response.json();
      console.log("Manual verification result:", result);

      if (result.success) {
        setSubscriptionActive(true);
        setIsProcessing(false);
        setError(null);
        setTimeout(() => {
          router.push("/?pro=true");
        }, 1000);
      } else {
        setError(result.error || "Activation failed. Please contact support.");
        setIsProcessing(false);
        setShowManualActivation(true);
      }
    } catch (err: any) {
      console.error("Manual activation error:", err);
      setError("Activation failed. Please contact support.");
      setIsProcessing(false);
      setShowManualActivation(true);
    }
  };

  if (!authChecked || isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Processing your subscription...</h2>
            <p className="text-muted-foreground">
              Please wait while we activate your Pro membership.
            </p>
            {showManualActivation && (
              <div className="mt-6">
                <p className="text-sm text-muted-foreground mb-3">
                  Taking longer than expected?
                </p>
                <Button onClick={handleManualActivation} variant="outline">
                  Activate Manually
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Manual activation function - works even if auth state is weird
  // This will auto-create account if user doesn't exist
  const manualActivate = async () => {
    setIsProcessing(true);
    setError(null);
    
    // First, verify the Stripe session and track the purchase
    try {
      console.log("Fetching Stripe session details for purchase tracking...");
      const sessionResponse = await fetch(`/api/stripe/session?session_id=${sessionId}`);
      const sessionData = await sessionResponse.json();
      
      if (sessionData.success && sessionData.payment_status === 'paid') {
        console.log("✅ Payment verified:", sessionData);
        
        // Track the purchase event with verified Stripe data
        trackPurchase({
          value: sessionData.value,
          currency: sessionData.currency,
          transaction_id: sessionData.transaction_id,
          plan: sessionData.plan,
        });
      }
    } catch (err) {
      console.error("Error fetching session for analytics:", err);
      // Continue with activation even if tracking fails
    }
    
    // Try to get current session - multiple methods
    let currentUser = null;
    let userEmail = null;
    
    // Method 1: getSession
    try {
      const { data: { session } } = await supabase.auth.getSession();
      currentUser = session?.user;
      userEmail = currentUser?.email;
      console.log("getSession result:", currentUser?.email || "no user");
    } catch (e) {
      console.log("getSession failed:", e);
    }
    
    // Method 2: If that failed, try getUser
    if (!currentUser) {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        currentUser = authUser;
        userEmail = currentUser?.email;
        console.log("getUser result:", currentUser?.email || "no user");
      } catch (e) {
        console.log("getUser failed:", e);
      }
    }
    
    // Method 3: Check localStorage directly
    if (!currentUser) {
      const storedSession = localStorage.getItem('sb-ddoginuyioiatbpfemxr-auth-token');
      if (storedSession) {
        try {
          const parsed = JSON.parse(storedSession);
          currentUser = parsed?.user;
          userEmail = currentUser?.email;
          console.log("localStorage user:", currentUser?.email || "no user");
        } catch (e) {
          console.log("Failed to parse localStorage session");
        }
      }
    }
    
    // The API will auto-create account if email is provided and user doesn't exist
    console.log("Calling verify-session (will auto-create account if needed):", {
      sessionId,
      userId: currentUser?.id || null,
      email: userEmail || null,
    });
    
    try {
      const response = await fetch("/api/stripe/verify-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          userId: currentUser?.id || null,
          email: userEmail || null,
        }),
      });

      const result = await response.json();
      console.log("Manual activation result:", result);

      if (result.success) {
        // If account was auto-created, try to sign them in
        if (result.email && !currentUser) {
          console.log("Account was auto-created, attempting sign-in for:", result.email);
          
          // Try passwordless OTP sign-in
          try {
            const { error: otpError } = await supabase.auth.signInWithOtp({
              email: result.email,
              options: {
                shouldCreateUser: false, // User already created
                emailRedirectTo: `${window.location.origin}/checkout-success?session_id=${sessionId}`,
              },
            });
            
            if (!otpError) {
              console.log("Magic link sent to email for sign-in");
              // Check if session was auto-established
              await new Promise(resolve => setTimeout(resolve, 1000));
              const { data: { session: newSession } } = await supabase.auth.getSession();
              if (newSession) {
                setUser(newSession.user);
              }
            }
          } catch (signInErr) {
            console.error("Error in auto-sign-in:", signInErr);
          }
        }
        
        setSubscriptionActive(true);
        setIsProcessing(false);
        setError(null);
        // Redirect to home page - user will be shown as Pro there
        setTimeout(() => {
          router.push("/?pro=true");
        }, 1000);
      } else {
        setError(result.error || "Failed to activate subscription");
        setIsProcessing(false);
      }
    } catch (err: any) {
      console.error("Manual activation error:", err);
      setError(err.message || "Failed to activate subscription");
      setIsProcessing(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <Link href="/" className="flex justify-center mb-6">
              <Logo size="lg" />
            </Link>
            <Check className="w-16 h-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold">Payment Successful!</h2>
            <p className="text-muted-foreground">
              Your payment was successful! We'll automatically create your account and activate your Pro subscription. 
              {isProcessing && " Please wait..."}
            </p>
            {error && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">{error}</p>
                {error.includes("check your email") && (
                  <p className="text-xs text-amber-600 mt-2">
                    Click the link in your email to sign in and access your Pro account.
                  </p>
                )}
              </div>
            )}
            <div className="pt-4 space-y-2">
              <Button 
                onClick={manualActivate}
                disabled={isProcessing}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Activating Your Account...
                  </>
                ) : (
                  "Activate Pro & Continue"
                )}
              </Button>
              <Link href="/">
                <Button variant="outline" className="w-full">Go Home</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (subscriptionActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <Check className="w-16 h-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold">Welcome to Pro!</h2>
            <p className="text-muted-foreground">
              Your subscription has been activated. Redirecting you to the app...
            </p>
            <div className="pt-4">
              <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center space-y-4">
          {error ? (
            <>
              <AlertCircle className="w-16 h-16 text-amber-500 mx-auto" />
              <h2 className="text-2xl font-bold">Payment Received</h2>
              <p className="text-muted-foreground">
                Your payment was successful but we&apos;re having trouble activating your subscription. Please try again or contact support.
              </p>
              <p className="text-sm text-red-500">{error}</p>
            </>
          ) : (
            <>
              <Check className="w-16 h-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold">Payment Received</h2>
              <p className="text-muted-foreground">
                Your payment was successful. Your subscription is being activated and should be ready shortly.
              </p>
            </>
          )}
          <div className="pt-4 space-y-2">
            <Button 
              onClick={() => {
                hasVerified.current = false;
                setError(null);
                setIsProcessing(true);
                window.location.reload();
              }}
              className="w-full"
            >
              Try Again
            </Button>
            <Link href="/settings">
              <Button variant="outline" className="w-full">Go to Settings</Button>
            </Link>
          </div>
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
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}


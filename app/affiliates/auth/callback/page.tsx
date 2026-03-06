"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Loader2, AlertCircle } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Get the current session after OAuth redirect
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          throw new Error("Authentication failed. Please try again.");
        }

        const user = session.user;
        const userEmail = user.email?.toLowerCase();

        if (!userEmail) {
          throw new Error("No email found in your account.");
        }

        // Check if this user is already linked to an affiliate
        const { data: existingAffiliate } = await supabase
          .from("affiliates")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (existingAffiliate) {
          // Already linked, redirect to dashboard
          router.push("/affiliates/dashboard");
          return;
        }

        // Check if there's an affiliate with matching email
        const { data: matchingAffiliate } = await supabase
          .from("affiliates")
          .select("*")
          .eq("email", userEmail)
          .is("user_id", null) // Not yet claimed
          .maybeSingle();

        if (matchingAffiliate) {
          // Link this Google account to the affiliate
          const { error: updateError } = await supabase
            .from("affiliates")
            .update({ user_id: user.id })
            .eq("id", matchingAffiliate.id);

          if (updateError) {
            throw new Error("Failed to link your account. Please contact support.");
          }

          // Redirect to dashboard
          router.push("/affiliates/dashboard");
          return;
        }

        // No existing affiliate — redirect to self-service signup
        router.push("/affiliates/signup");
      } catch (err: any) {
        setError(err.message || "Authentication failed");
      }
    };

    handleAuth();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Unable to sign in</h1>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => router.push("/affiliates/login")}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-600 mx-auto mb-4" />
        <p className="text-gray-600">Setting up your dashboard...</p>
      </div>
    </div>
  );
}

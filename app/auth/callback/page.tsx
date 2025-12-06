"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      // Check if we have a code in the URL
      const code = searchParams.get("code");
      const next = searchParams.get("next") ?? "/search";

      if (code) {
        try {
          // Exchange code for session
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            console.error("Error exchanging code:", error);
            router.replace("/login?error=auth_error");
            return;
          }

          if (data.session) {
            // Session is set, wait a moment for state to update, then redirect
            setTimeout(() => {
              router.replace(next);
            }, 500);
          } else {
            router.replace("/login?error=no_session");
          }
        } catch (err) {
          console.error("Callback error:", err);
          router.replace("/login?error=auth_error");
        }
      } else {
        // No code, check if we're already authenticated
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.replace(next);
        } else {
          router.replace("/login");
        }
      }
    };

    handleCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}


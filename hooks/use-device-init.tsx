"use client";

import { useEffect } from "react";
import { getDeviceId } from "@/lib/device-id";
import { supabase } from "@/lib/supabase/client";

/**
 * Hook to initialize device ID and auto-login device user on app load
 * This ensures every visitor gets a consistent device-based user ID
 */
export function useDeviceInit() {
  useEffect(() => {
    const initDeviceUser = async () => {
      // Create device ID immediately (for debugging and consistency)
      const deviceId = getDeviceId();
      console.log("🔑 Device ID initialized:", deviceId);

      // Check if already logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        console.log("✅ Already logged in:", session.user.id);
        return;
      }

      // Try to auto-login with device-based email
      const deviceEmail = `device_${deviceId}@revealai.device`;
      
      try {
        // Try to sign in with existing device account
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: deviceEmail,
          password: deviceId,
        });

        if (signInData?.user) {
          console.log("✅ Auto-logged in with device account:", signInData.user.id);
          return;
        }

        // If sign-in failed, try to create new device account
        if (signInError) {
          console.log("📝 Creating new device account...");
          
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: deviceEmail,
            password: deviceId,
            options: {
              data: {
                device_id: deviceId,
                is_device_user: true,
              },
              emailRedirectTo: undefined, // Don't send confirmation email
            },
          });

          if (signUpData?.user) {
            console.log("✅ Device account created:", signUpData.user.id);
          } else if (signUpError) {
            // If already exists, try sign in again
            if (signUpError.message.includes('already registered')) {
              const { data: retryData } = await supabase.auth.signInWithPassword({
                email: deviceEmail,
                password: deviceId,
              });
              if (retryData?.user) {
                console.log("✅ Signed in with existing device account:", retryData.user.id);
              }
            }
          }
        }
      } catch (error) {
        console.log("ℹ️ Device auth not critical, continuing...", error);
      }
    };

    // Run initialization
    initDeviceUser();
  }, []);
}


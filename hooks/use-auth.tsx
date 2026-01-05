"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase/client";
import { getDeviceId } from "@/lib/device-id";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  signInWithOAuth: (provider: "google" | "apple") => Promise<void>;
  getDeviceUserId: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get or create a device-based user ID for subscriptions
  // This creates a persistent user tied to the device, not an email
  const getDeviceUserId = useCallback(async (): Promise<string | null> => {
    // If user is already logged in, use their ID
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      return session.user.id;
    }

    // Get device ID
    const deviceId = getDeviceId();
    const deviceEmail = `device_${deviceId}@revealai.device`;

    try {
      // Try to find existing user with this device email
      const { data: existingSession } = await supabase.auth.getSession();
      if (existingSession?.user?.email === deviceEmail) {
        return existingSession.user.id;
      }

      // Try to sign in with device email (will fail if doesn't exist, that's ok)
      const { data: signInData } = await supabase.auth.signInWithPassword({
        email: deviceEmail,
        password: deviceId, // Use device ID as password
      });

      if (signInData?.user?.id) {
        return signInData.user.id;
      }
    } catch (error) {
      // User doesn't exist yet, that's ok
    }

    // Create new device-based user
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: deviceEmail,
        password: deviceId,
        options: {
          data: {
            device_id: deviceId,
            is_device_user: true,
          },
          emailRedirectTo: undefined, // Don't send email
        },
      });

      if (signUpError) {
        // If user already exists, try sign in again
        if (signUpError.message.includes('already registered')) {
          const { data: retrySignIn } = await supabase.auth.signInWithPassword({
            email: deviceEmail,
            password: deviceId,
          });
          if (retrySignIn?.user?.id) {
            return retrySignIn.user.id;
          }
        }
        console.error("Error creating device user:", signUpError);
        return null;
      }

      if (signUpData?.user?.id) {
        console.log("✅ Created device-based user:", signUpData.user.id);
        return signUpData.user.id;
      }
    } catch (error) {
      console.error("Error in getDeviceUserId:", error);
    }

    return null;
  }, []);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error getting session:", error);
      }
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error ? new Error(error.message) : null };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error: error ? new Error(error.message) : null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const signInWithOAuth = useCallback(async (provider: "google" | "apple") => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }, []);

  return (
      <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        signIn,
        signUp,
        signOut,
        signInWithOAuth,
        getDeviceUserId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}


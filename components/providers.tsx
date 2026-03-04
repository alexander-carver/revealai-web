"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect, type ReactNode } from "react";
import { AuthProvider } from "@/hooks/use-auth";
import { SubscriptionProvider } from "@/hooks/use-subscription";
import { useDeviceInit } from "@/hooks/use-device-init";
import { captureAffiliateRef } from "@/lib/affiliate";

function DeviceInitializer() {
  useDeviceInit();
  return null;
}

function AffiliateTracker() {
  useEffect(() => {
    captureAffiliateRef();
  }, []);
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SubscriptionProvider>
          <DeviceInitializer />
          <AffiliateTracker />
          {children}
        </SubscriptionProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}


"use client";

import { Navigation } from "./navigation";
import { MainPaywallModal } from "./main-paywall-modal";
import { AbandonedPaywallModal } from "./abandoned-paywall-modal";
import { cn } from "@/lib/utils";
import { ScrollToTop } from "@/components/shared/scroll-to-top";

interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function AppLayout({ children, className }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main
        className={cn(
          "lg:pl-64 pt-16 lg:pt-16 pb-20 lg:pb-0 min-h-screen",
          className
        )}
      >
        <div className="container mx-auto px-4 py-6 lg:py-8 max-w-6xl">
          {children}
        </div>
      </main>
      {/* Main paywall - shown immediately when non-pro users try to search */}
      <MainPaywallModal />
      {/* Abandoned paywall - shown for transaction abandoned scenarios */}
      <AbandonedPaywallModal />
      <ScrollToTop />
    </div>
  );
}


"use client";

import { Navigation } from "./navigation";
import { PaywallModal } from "./paywall-modal";
import { cn } from "@/lib/utils";

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
          "lg:pl-64 pt-16 lg:pt-0 pb-20 lg:pb-0 min-h-screen",
          className
        )}
      >
        <div className="container mx-auto px-4 py-6 lg:py-8 max-w-6xl">
          {children}
        </div>
      </main>
      <PaywallModal />
    </div>
  );
}


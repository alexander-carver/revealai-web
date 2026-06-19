"use client";

import { usePathname } from "next/navigation";
import { Navigation } from "./navigation";
import { MainPaywallModal } from "./main-paywall-modal";
import { cn } from "@/lib/utils";
import { ScrollToTop } from "@/components/shared/scroll-to-top";

interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function AppLayout({ children, className }: AppLayoutProps) {
  const pathname = usePathname();
  const hideNavigation =
    pathname === "/search" ||
    pathname === "/social" ||
    pathname === "/followers" ||
    pathname === "/phone" ||
    pathname === "/records" ||
    pathname === "/vehicle" ||
    pathname === "/username" ||
    pathname === "/privacy" ||
    pathname === "/unclaimed";

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main
        className={cn(
          hideNavigation
            ? "min-h-screen"
            : "lg:pl-64 pt-16 lg:pt-16 pb-6 lg:pb-0 min-h-screen",
          className
        )}
      >
        <div
          className={cn(
            "container mx-auto px-4 max-w-6xl",
            hideNavigation ? "py-6 md:py-10" : "py-6 lg:py-8"
          )}
        >
          {children}
        </div>
      </main>
      {/* Main paywall - shown immediately when non-pro users try to search */}
      <MainPaywallModal />
      <ScrollToTop />
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  History,
  Settings,
  Menu,
  X,
  LogOut,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { SEARCH_PRODUCT_IDS, getSearchProduct } from "@/lib/search-products";
import { useState, useEffect } from "react";

const accountItems = [
  { href: "/history", label: "Search History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

const searchItems = SEARCH_PRODUCT_IDS.map((productId) => {
  const product = getSearchProduct(productId);

  return {
    href: product.toolPath,
    label: product.menuLabel,
    description: product.home.helperText,
    icon: product.icon,
    accent: product.theme.primary,
    soft: product.theme.soft,
    border: product.theme.softBorder,
  };
});

// Desktop Header Component (hides on scroll)
function DesktopHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show header when scrolling up, hide when scrolling down
      if (currentScrollY < lastScrollY || currentScrollY < 10) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <header 
      className={`hidden lg:flex fixed top-0 left-64 right-0 h-16 border-b border-border bg-card/80 backdrop-blur-xl z-30 transition-transform duration-300 ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex-1" />
        <button
          onClick={onMenuClick}
          aria-label="Open search menu"
          className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
        >
          <Menu className="h-4 w-4" />
          All Searches
        </button>
      </div>
    </header>
  );
}

// Mobile Header Component (hides on scroll)
function MobileHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show header when scrolling up, hide when scrolling down
      if (currentScrollY < lastScrollY || currentScrollY < 10) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <header 
      className={`lg:hidden fixed top-0 left-0 right-0 h-16 border-b border-border bg-card/80 backdrop-blur-xl z-40 transition-transform duration-300 ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="flex items-center justify-between h-full px-4">
        <Link href="/">
          <Logo size="sm" />
        </Link>
        <button
          onClick={onMenuClick}
          aria-label="Open search menu"
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
}

export function Navigation() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { isPro, showPaywall } = useSubscription();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  if (hideNavigation) {
    return null;
  }

  return (
    <>
      {/* Desktop Top Header - Hide on scroll */}
      <DesktopHeader onMenuClick={() => setMobileMenuOpen(true)} />

      {/* Desktop Navigation */}
      <nav className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 flex-col border-r border-border bg-card/50 backdrop-blur-xl z-40">
        {/* Logo */}
        <Link href="/" className="px-6 h-16 border-b border-border flex items-center">
          <Logo size="md" />
        </Link>

        {/* Account Items */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {accountItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all relative",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="flex-1">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Pro Badge / Upgrade Button */}
        <div className="p-4 border-t border-border">
          {isPro ? (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
              <Crown className="w-5 h-5 text-amber-500" />
              <span className="font-medium text-amber-500">Pro Member</span>
            </div>
          ) : (
            <Button
              onClick={() => showPaywall()}
              className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              <Crown className="w-4 h-4" />
              Upgrade to Pro
            </Button>
          )}
        </div>

        {/* User Section */}
        <div className="p-4 border-t border-border">
          {user ? (
            <button
              onClick={() => signOut()}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all w-full"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          ) : (
            <Link href="/login">
              <Button variant="outline" className="w-full">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </nav>

      {/* Mobile Header - Hide on scroll */}
      <MobileHeader onMenuClick={() => setMobileMenuOpen(true)} />

      {/* Search Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-[360px] max-w-[92vw] bg-card border-l border-border animate-slide-in-right">
            <div className="flex items-center justify-between h-16 px-4 border-b border-border">
              <span className="font-semibold">All Searches</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 px-3 space-y-5 overflow-y-auto max-h-[calc(100vh-8rem)]">
              <div>
                <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Search Tools
                </p>
                <div className="space-y-2">
                  {searchItems.map((item) => {
                    const isActive =
                      pathname === item.href || pathname.startsWith(`${item.href}/`);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-start gap-3 rounded-2xl border px-4 py-3 transition-all",
                          isActive
                            ? "border-transparent bg-primary/5"
                            : "border-border hover:bg-muted/60"
                        )}
                        style={
                          isActive
                            ? {
                                backgroundColor: item.soft,
                                borderColor: item.border,
                              }
                            : undefined
                        }
                      >
                        <span
                          className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl"
                          style={{ backgroundColor: item.soft }}
                        >
                          <item.icon
                            className="h-4 w-4"
                            style={{ color: item.accent }}
                          />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-foreground">
                            {item.label}
                          </span>
                          <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                            {item.description}
                          </span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {user && (
                <div className="pt-4 border-t border-border mt-4">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      signOut();
                    }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all w-full"
                  >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
              {!isPro && (
                <Button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    showPaywall();
                  }}
                  className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                >
                  <Crown className="w-4 h-4" />
                  Upgrade to Pro
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

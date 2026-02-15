"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  FileText,
  AtSign,
  Car,
  Shield,
  DollarSign,
  Phone,
  History,
  Settings,
  Menu,
  X,
  LogOut,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/shared/logo";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { useState, useEffect } from "react";

const navItems = [
  { href: "/search", label: "People Search", icon: Search },
  { href: "/phone", label: "Phone Lookup", icon: Phone },
  { href: "/records", label: "Records", icon: FileText },
  { href: "/username", label: "Username", icon: AtSign },
  { href: "/vehicle", label: "Vehicle", icon: Car },
  { href: "/privacy", label: "Remove YOUR sensitive Info", icon: Shield, badge: "Urgent" },
  { href: "/unclaimed", label: "Unclaimed $", icon: DollarSign, badge: "try" },
];

// Desktop Header Component (hides on scroll)
function DesktopHeader({ user, isPro }: { user: any; isPro: boolean }) {
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
        <div className="flex-1" /> {/* Spacer */}
        {user && (
          <div className="flex items-center gap-3">
            <div 
              className="px-2 py-1 rounded bg-muted/50 border border-border text-[10px] font-mono text-foreground select-all cursor-text" 
              title={user.id}
            >
              {user.id.substring(0, 8)}...
            </div>
            {isPro && (
              <div className="flex items-center gap-2 px-2 py-1 rounded bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                <Crown className="w-3 h-3 text-amber-500" />
                <span className="text-[10px] font-medium text-amber-500">Pro</span>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

// Mobile Header Component (hides on scroll)
function MobileHeader({ user, isPro, onMenuClick }: { user: any; isPro: boolean; onMenuClick: () => void }) {
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
        <div className="flex items-center gap-2">
          {/* User ID (mobile) */}
          {user && (
            <div 
              className="px-2 py-1 rounded bg-muted/50 border border-border text-[9px] font-mono text-foreground select-all cursor-text max-w-[100px] truncate" 
              title={user.id}
            >
              {user.id.substring(0, 8)}...
            </div>
          )}
          {user && isPro && (
            <Crown className="w-4 h-4 text-amber-500" />
          )}
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
    </header>
  );
}

export function Navigation() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { isPro, showPaywall } = useSubscription();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Desktop Top Header - Hide on scroll */}
      <DesktopHeader user={user} isPro={isPro} />

      {/* Desktop Navigation */}
      <nav className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 flex-col border-r border-border bg-card/50 backdrop-blur-xl z-40">
        {/* Logo */}
        <Link href="/" className="px-6 h-16 border-b border-border flex items-center">
          <Logo size="md" />
        </Link>

        {/* Nav Items */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
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
                {item.badge && (
                  <Badge
                    className={`bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full`}
                  >
                    {item.badge}
                  </Badge>
                )}
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
              onClick={showPaywall}
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
            <div className="space-y-2">
              <Link
                href="/history"
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  pathname === "/history"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <History className="w-5 h-5" />
                Search History
              </Link>
              <Link
                href="/settings"
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  pathname === "/settings"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Settings className="w-5 h-5" />
                Settings
              </Link>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all w-full"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
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
      <MobileHeader user={user} isPro={isPro} onMenuClick={() => setMobileMenuOpen(true)} />

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-card border-l border-border animate-slide-in-right">
            <div className="flex items-center justify-between h-16 px-4 border-b border-border">
              <span className="font-semibold">Menu</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="py-4 px-3 space-y-1 overflow-y-auto max-h-[calc(100vh-8rem)]">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all relative",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <Badge
                        className={`bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full`}
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}
              <div className="pt-4 border-t border-border mt-4">
                <Link
                  href="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Settings className="w-5 h-5" />
                  Settings
                </Link>
              </div>
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

      {/* Mobile Bottom Tab Bar - Show all 6 nav items */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 border-t border-border bg-card/80 backdrop-blur-xl z-40">
        <div className="flex items-center justify-between h-full px-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 flex-1 py-2 rounded-lg transition-colors relative",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <div className="relative">
                  <item.icon className="w-4 h-4" />
                  {item.badge && (
                    <Badge
                      className={`absolute -top-1 -right-1 bg-red-500 text-white text-[7px] font-bold px-0.5 py-0 rounded-full h-2.5 min-w-[10px] flex items-center justify-center`}
                    >
                      {item.badge}
                    </Badge>
                  )}
                </div>
                <span className="text-[8px] font-medium leading-tight text-center px-0.5">
                  {item.label === "Remove YOUR sensitive Info" 
                    ? "Remove" 
                    : item.label === "Unclaimed $"
                    ? "Unclaimed"
                    : item.label.split(" ")[0]}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}


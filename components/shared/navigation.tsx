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
import { useState } from "react";

const navItems = [
  { href: "/search", label: "People Search", icon: Search },
  { href: "/records", label: "Records", icon: FileText },
  { href: "/username", label: "Username", icon: AtSign },
  { href: "/vehicle", label: "Vehicle", icon: Car },
  { href: "/privacy", label: "Remove YOUR sensitive Info", icon: Shield, badge: "Urgent" },
  { href: "/unclaimed", label: "Unclaimed $", icon: DollarSign, badge: "try" },
];

export function Navigation() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { isPro, showPaywall } = useSubscription();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
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

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 border-b border-border bg-card/80 backdrop-blur-xl z-40">
        <div className="flex items-center justify-between h-full px-4">
          <Link href="/">
            <Logo size="sm" />
          </Link>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

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

      {/* Mobile Bottom Tab Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-border bg-card/80 backdrop-blur-xl z-40">
        <div className="flex items-center justify-around h-full">
          {navItems.slice(0, 5).map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors relative",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <div className="relative">
                  <item.icon className="w-5 h-5" />
                  {item.badge && (
                    <Badge
                      className={`absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold px-1 py-0 rounded-full h-3 min-w-[12px] flex items-center justify-center`}
                    >
                      {item.badge}
                    </Badge>
                  )}
                </div>
                <span className="text-[10px] font-medium">{item.label.split(" ")[0]}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}


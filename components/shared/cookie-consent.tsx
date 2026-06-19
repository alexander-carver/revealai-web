"use client";

import { useState, useEffect } from "react";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("revealai_cookie_consent");
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const updateConsent = (granted: boolean) => {
    if (typeof window !== "undefined" && window.gtag) {
      const state = granted ? "granted" : "denied";
      window.gtag("consent", "update", {
        ad_storage: state,
        ad_user_data: state,
        ad_personalization: state,
        analytics_storage: state,
      });
    }
  };

  const handleAccept = () => {
    localStorage.setItem("revealai_cookie_consent", "accepted");
    setIsVisible(false);
    updateConsent(true);
  };

  const handleDecline = () => {
    localStorage.setItem("revealai_cookie_consent", "declined");
    setIsVisible(false);
    updateConsent(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom-4 duration-500 px-3 pb-3 sm:px-4 sm:pb-4 md:bottom-4 md:left-auto md:right-4 md:max-w-sm md:px-0 md:pb-0">
      <div className="bg-white rounded-t-2xl border border-gray-200 p-4 shadow-2xl md:rounded-2xl md:p-5">
        <div className="mb-4 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-100 flex-shrink-0">
            <Cookie className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-sm">We use cookies</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              We use cookies to improve your experience and personalize content. By clicking &quot;Accept&quot;, you consent to our use of cookies.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleDecline}
            variant="ghost"
            size="sm"
            className="flex-1 text-xs text-gray-400 hover:text-gray-600"
          >
            Decline
          </Button>
          <Button
            onClick={handleAccept}
            size="sm"
            className="flex-[2] text-xs bg-gray-900 hover:bg-gray-800 text-white font-semibold"
          >
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}

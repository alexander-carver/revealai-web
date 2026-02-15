"use client";

import { useState, useEffect } from "react";
import { Cookie, X } from "lucide-react";
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

  const handleAccept = () => {
    localStorage.setItem("revealai_cookie_consent", "accepted");
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("revealai_cookie_consent", "declined");
    setIsVisible(false);
    if (typeof window !== "undefined") {
      // Disable GA4
      if (window.gtag) {
        window.gtag("consent", "update", {
          analytics_storage: "denied",
          ad_storage: "denied",
        });
      }
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 lg:bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-lg bg-amber-100 flex-shrink-0">
            <Cookie className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-sm">We use cookies</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              We use cookies and similar technologies to improve your experience, analyze traffic, and personalize ads. By clicking &quot;Accept&quot;, you consent to our use of cookies.
            </p>
          </div>
          <button
            onClick={handleDecline}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleDecline}
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
          >
            Decline
          </Button>
          <Button
            onClick={handleAccept}
            size="sm"
            className="flex-1 text-xs bg-gray-900 hover:bg-gray-800"
          >
            Accept All
          </Button>
        </div>
      </div>
    </div>
  );
}

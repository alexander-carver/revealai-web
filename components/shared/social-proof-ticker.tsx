"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Shield, FileText, AtSign } from "lucide-react";

const FIRST_NAMES = [
  "Sarah", "Michael", "Emily", "James", "Jessica", "David", "Ashley", "Robert",
  "Amanda", "Daniel", "Jennifer", "Chris", "Nicole", "Matt", "Rachel", "Kevin",
  "Megan", "Andrew", "Lauren", "Brian", "Stephanie", "Jason", "Maria", "Ryan",
];

const CITIES = [
  "Austin, TX", "Miami, FL", "Denver, CO", "Seattle, WA", "Phoenix, AZ",
  "Chicago, IL", "Atlanta, GA", "Portland, OR", "Nashville, TN", "San Diego, CA",
  "Charlotte, NC", "Tampa, FL", "Dallas, TX", "Columbus, OH", "Raleigh, NC",
  "Las Vegas, NV", "Orlando, FL", "Indianapolis, IN", "Minneapolis, MN", "Houston, TX",
];

const ACTIONS = [
  { text: "ran a people search", icon: Search, color: "text-blue-500" },
  { text: "checked their privacy score", icon: Shield, color: "text-rose-500" },
  { text: "searched records", icon: FileText, color: "text-amber-500" },
  { text: "searched a username", icon: AtSign, color: "text-purple-500" },
];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomMinutesAgo(): string {
  const mins = Math.floor(Math.random() * 12) + 1;
  return `${mins} min ago`;
}

export function SocialProofTicker() {
  const [notification, setNotification] = useState<{
    name: string;
    city: string;
    action: (typeof ACTIONS)[0];
    time: string;
  } | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const showNotification = useCallback(() => {
    setNotification({
      name: getRandomItem(FIRST_NAMES),
      city: getRandomItem(CITIES),
      action: getRandomItem(ACTIONS),
      time: getRandomMinutesAgo(),
    });
    setIsVisible(true);

    setTimeout(() => setIsVisible(false), 4000);
  }, []);

  useEffect(() => {
    // First notification after 8 seconds
    const initialTimer = setTimeout(showNotification, 8000);

    // Then every 15-25 seconds
    const interval = setInterval(() => {
      const delay = Math.random() * 10000 + 15000;
      setTimeout(showNotification, delay);
    }, 25000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [showNotification]);

  if (!notification) return null;

  const Icon = notification.action.icon;

  return (
    <div
      className={`fixed bottom-24 lg:bottom-4 left-4 z-30 transition-all duration-500 ${
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-3 max-w-xs">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-gray-50`}>
            <Icon className={`w-4 h-4 ${notification.action.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {notification.name} from {notification.city}
            </p>
            <p className="text-xs text-gray-500">
              {notification.action.text} &middot; {notification.time}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

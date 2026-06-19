"use client";

import {
  MapPin,
  Users,
  Phone,
  Mail,
  DollarSign,
  Heart,
  Home,
  Gavel,
  FileText,
  Camera,
  Briefcase,
  CreditCard,
} from "lucide-react";

const FEATURES = [
  {
    icon: Mail,
    label: "Contact Information",
  },
  {
    icon: MapPin,
    label: "Location History",
  },
  {
    icon: Users,
    label: "Social Media Profiles",
  },
  {
    icon: DollarSign,
    label: "Financial Assets",
  },
  {
    icon: Heart,
    label: "Dating Websites",
  },
  {
    icon: Home,
    label: "Property Records",
  },
  {
    icon: Camera,
    label: "Photos & Images",
  },
  {
    icon: Gavel,
    label: "Court Records",
  },
  {
    icon: FileText,
    label: "Public Records",
  },
  {
    icon: Phone,
    label: "Phone Numbers",
  },
  {
    icon: Briefcase,
    label: "Employment History",
  },
  {
    icon: CreditCard,
    label: "Business Records",
  },
];

export function FeaturesSlider() {
  const duplicatedFeatures = [...FEATURES, ...FEATURES];

  return (
    <div className="relative left-1/2 mt-8 w-screen -translate-x-1/2 overflow-hidden px-4 sm:px-6 lg:px-10">
      <div
        className="pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-16 sm:w-24"
        style={{
          background:
            "linear-gradient(to right, var(--product-surface, rgba(255,255,255,1)) 0%, rgba(255,255,255,0) 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-16 sm:w-24"
        style={{
          background:
            "linear-gradient(to left, var(--product-surface, rgba(255,255,255,1)) 0%, rgba(255,255,255,0) 100%)",
        }}
      />

      <div className="overflow-hidden py-3 sm:py-4">
        <div
          className="flex gap-5 sm:gap-7"
          style={{
            animation: "scroll-horizontal 40s linear infinite",
          }}
        >
          {duplicatedFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={`${feature.label}-${index}`}
                className="flex min-w-[88px] flex-shrink-0 flex-col items-center gap-2 sm:min-w-[104px]"
              >
                <Icon
                  className="h-5 w-5 sm:h-6 sm:w-6"
                  style={{ color: "var(--product-primary)" }}
                />
                <span
                  className="max-w-[88px] text-center text-[11px] font-medium leading-4 sm:max-w-[104px] sm:text-xs"
                  style={{ color: "var(--product-primary)" }}
                >
                  {feature.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

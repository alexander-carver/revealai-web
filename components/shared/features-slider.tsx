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
  { icon: Mail, label: "Contact Information" },
  { icon: MapPin, label: "Location History" },
  { icon: Users, label: "Social Media Profiles" },
  { icon: DollarSign, label: "Financial Assets" },
  { icon: Heart, label: "Dating Websites" },
  { icon: Home, label: "Property Records" },
  { icon: Camera, label: "Photos & Images" },
  { icon: Gavel, label: "Court Records" },
  { icon: FileText, label: "Public Records" },
  { icon: Phone, label: "Phone Numbers" },
  { icon: Briefcase, label: "Employment History" },
  { icon: CreditCard, label: "Business Records" },
];

export function FeaturesSlider() {
  // Duplicate features for seamless infinite scroll
  const duplicatedFeatures = [...FEATURES, ...FEATURES];

  return (
    <div className="mt-6 overflow-hidden">
      <div className="relative">
        {/* Gradient overlays for fade effect */}
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
        
        {/* Scrolling container */}
        <div className="overflow-hidden">
          <div 
            className="flex gap-6"
            style={{
              animation: "scroll-horizontal 40s linear infinite",
            }}
          >
            {duplicatedFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="flex flex-col items-center gap-2 min-w-[120px] flex-shrink-0"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-xs text-center text-muted-foreground font-medium whitespace-nowrap">
                    {feature.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}


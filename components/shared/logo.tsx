"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { container: "w-8 h-8", image: 32 },
  md: { container: "w-9 h-9", image: 36 },
  lg: { container: "w-12 h-12", image: 48 },
};

export function Logo({ size = "md", showText = true, className }: LogoProps) {
  const { container, image } = sizeMap[size];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn(container, "relative flex items-center justify-center")}>
        <Image
          src="/logo.png"
          alt="RevealAI Logo"
          width={image}
          height={image}
          className="object-contain"
          priority
          onError={(e) => {
            // Fallback: hide image if it doesn't exist
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </div>
      {showText && (
        <span className={cn(
          "font-bold",
          size === "sm" && "text-lg",
          size === "md" && "text-xl",
          size === "lg" && "text-2xl"
        )}>
          RevealAI
        </span>
      )}
    </div>
  );
}


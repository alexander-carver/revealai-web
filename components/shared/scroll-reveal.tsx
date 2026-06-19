"use client";

import type { ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delayMs?: number;
  distance?: number;
  threshold?: number;
  as?: "div" | "li" | "section";
  once?: boolean;
}

export function ScrollReveal({
  children,
  className,
  as: Tag = "div",
}: ScrollRevealProps) {
  return <Tag className={className}>{children}</Tag>;
}

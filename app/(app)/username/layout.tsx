import type { Metadata } from "next";
import { BASE_URL } from "@/lib/search-products";

export const metadata: Metadata = {
  title: "Username Search - Find Social Profiles Across 100+ Platforms",
  description:
    "Search for social media profiles and online presence across 100+ platforms using a username. Find Instagram, X, Facebook, LinkedIn, TikTok, and more with RevealAI.",
  keywords: [
    "username search",
    "social media search",
    "social profile search",
    "username lookup",
    "find social media by username",
  ],
  alternates: {
    canonical: `${BASE_URL}/dating-app-search`,
  },
  robots: {
    index: false,
    follow: true,
    googleBot: {
      index: false,
      follow: true,
    },
  },
  openGraph: {
    title: "Username Search - Find Social Profiles | RevealAI",
    description:
      "Search for social media profiles across 100+ platforms using a username.",
    url: `${BASE_URL}/username`,
  },
};

export default function UsernameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

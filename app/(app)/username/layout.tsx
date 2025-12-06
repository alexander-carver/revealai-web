import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Username Search - Find Social Profiles Across 100+ Platforms",
  description:
    "Search for social media profiles and online presence across 100+ platforms using a username. Find Instagram, Twitter, Facebook, LinkedIn, TikTok, and more with RevealAI.",
  keywords: [
    "username search",
    "social media search",
    "social profile search",
    "find social media",
    "username lookup",
    "social media finder",
    "online presence",
    "social profiles",
  ],
  openGraph: {
    title: "Username Search - Find Social Profiles | RevealAI",
    description:
      "Search for social media profiles across 100+ platforms using a username. Find Instagram, Twitter, Facebook, and more.",
    url: "https://revealai-peoplesearch.com/username",
  },
};

export default function UsernameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}


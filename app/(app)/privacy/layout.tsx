import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy & Data Removal - Remove Your Info from Data Brokers",
  description:
    "Remove your personal information from data brokers and protect your privacy. Check your data exposure and opt out from people search sites with RevealAI.",
  keywords: [
    "privacy",
    "data removal",
    "opt out",
    "data brokers",
    "privacy protection",
    "remove personal information",
    "data privacy",
    "opt out from people search",
  ],
  openGraph: {
    title: "Privacy & Data Removal - Protect Your Information | RevealAI",
    description:
      "Remove your personal information from data brokers and protect your privacy. Check your data exposure.",
    url: "https://revealai-peoplesearch.com/privacy",
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}


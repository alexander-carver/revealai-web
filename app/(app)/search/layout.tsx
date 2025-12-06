import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "People Search - Find Anyone by Name, Phone, Email, or Address",
  description:
    "Search for anyone using their name, phone number, email address, or physical address. Access 500M+ public records, social profiles, and background information with RevealAI's AI-powered people search.",
  keywords: [
    "people search",
    "find people",
    "person search",
    "name search",
    "phone lookup",
    "email lookup",
    "address lookup",
    "people finder",
    "reverse phone lookup",
    "background check",
  ],
  openGraph: {
    title: "People Search - Find Anyone | RevealAI",
    description:
      "Search for anyone using name, phone, email, or address. Access 500M+ public records and social profiles.",
    url: "https://revealai.com/search",
  },
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}


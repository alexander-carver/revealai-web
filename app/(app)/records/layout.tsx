import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Records Search - Court Records, Criminal History & Public Filings",
  description:
    "Search court records, criminal history, public filings, and legal documents. Access comprehensive background information with RevealAI's records search.",
  keywords: [
    "court records",
    "criminal records",
    "public records",
    "background check",
    "criminal history",
    "arrest records",
    "court filings",
    "legal records",
    "public filings",
  ],
  openGraph: {
    title: "Records Search - Court & Criminal Records | RevealAI",
    description:
      "Search court records, criminal history, and public filings. Access comprehensive background information.",
    url: "https://revealai-peoplesearch.com/records",
  },
};

export default function RecordsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}


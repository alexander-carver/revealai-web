import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reverse Phone Lookup | Find Who Called You",
  description:
    "Free reverse phone lookup. Find out who owns any phone number. Identify unknown callers, spam calls, and scam numbers with AI-powered search.",
  keywords: [
    "reverse phone lookup",
    "phone number lookup",
    "who called me",
    "caller ID",
    "spam caller lookup",
    "phone search",
    "unknown caller",
    "scam phone number",
  ],
};

export default function PhoneLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

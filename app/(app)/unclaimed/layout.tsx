import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Unclaimed Money - Find Money Owed to You by State Governments",
  description:
    "Search for unclaimed money, property, and assets owed to you by state governments. Find forgotten bank accounts, insurance payouts, tax refunds, and more with RevealAI.",
  keywords: [
    "unclaimed money",
    "unclaimed property",
    "find money",
    "unclaimed funds",
    "state treasury",
    "lost money",
    "unclaimed assets",
    "forgotten money",
  ],
  openGraph: {
    title: "Unclaimed Money - Find Money Owed to You | RevealAI",
    description:
      "Search for unclaimed money, property, and assets owed to you by state governments. Find forgotten bank accounts and more.",
    url: "https://revealai-peoplesearch.com/unclaimed",
  },
};

export default function UnclaimedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}


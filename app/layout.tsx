import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://revealai-peoplesearch.com"),
  title: {
    default: "Reveal AI - People Search | Safety Lookup & Privacy Toolkit",
    template: "%s | Reveal AI",
  },
  description:
    "Reveal AI - Safety Lookup & Privacy Toolkit. Take control of your privacy and verify what's real. Search people, block spam calls free, remove your data from broker sites, find unclaimed money, and monitor dark web breaches. Results retrieved on-demand from licensed public data providers.",
  keywords: [
    "reveal ai",
    "revealai",
    "people search",
    "safety lookup",
    "reverse phone lookup",
    "spam blocker",
    "privacy protection",
    "identity check",
    "contact verification",
    "phone lookup",
    "scam blocker",
    "privacy toolkit",
    "background check",
    "public records",
    "social media search",
    "email lookup",
    "address lookup",
    "court records",
    "criminal records",
    "people finder",
    "person search",
    "remove data from brokers",
    "unclaimed money",
    "dark web monitoring",
  ],
  authors: [{ name: "RevealAI" }],
  creator: "RevealAI",
  publisher: "RevealAI",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://revealai-peoplesearch.com",
    siteName: "RevealAI",
    title: "Reveal AI - People Search | Safety Lookup & Privacy Toolkit",
    description:
      "Reveal AI - Safety Lookup & Privacy Toolkit. Search people, block spam calls, remove your data from brokers, find unclaimed money. Verify what's real with on-demand results from licensed providers.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "RevealAI - AI-Powered People Search",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Reveal AI - People Search | Safety Lookup & Privacy Toolkit",
    description:
      "Search 500M+ public records, social profiles, and background information with AI-powered people search.",
    images: ["/logo.png"],
    creator: "@revealai", // Update with your Twitter handle if you have one
  },
  alternates: {
    canonical: "https://revealai-peoplesearch.com",
  },
  verification: {
    // Add these when you set up Google Search Console and Bing Webmaster
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
    // yahoo: "your-yahoo-verification-code",
  },
  category: "People Search",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${outfit.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
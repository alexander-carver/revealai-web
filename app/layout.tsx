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
  metadataBase: new URL("https://revealai.com"), // Update this when you get your domain
  title: {
    default: "RevealAI - People Search & Background Check | AI-Powered Research",
    template: "%s | RevealAI",
  },
  description:
    "RevealAI is the leading AI-powered people search platform. Find anyone using name, phone, email, or address. Search 500M+ public records, social profiles, court records, and more. Trusted by millions for accurate background checks and people intelligence.",
  keywords: [
    "reveal ai",
    "revealai",
    "people search",
    "background check",
    "public records",
    "social media search",
    "reverse phone lookup",
    "email lookup",
    "address lookup",
    "court records",
    "criminal records",
    "people finder",
    "person search",
    "people intelligence",
    "AI people search",
    "background check online",
    "public records search",
    "social profile search",
    "phone number lookup",
    "people search engine",
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
    url: "https://revealai.com", // Update this when you get your domain
    siteName: "RevealAI",
    title: "RevealAI - People Search & Background Check | AI-Powered Research",
    description:
      "Search 500M+ public records, social profiles, and background information with AI-powered people search. Find anyone using name, phone, email, or address.",
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
    title: "RevealAI - People Search & Background Check",
    description:
      "Search 500M+ public records, social profiles, and background information with AI-powered people search.",
    images: ["/logo.png"],
    creator: "@revealai", // Update with your Twitter handle if you have one
  },
  alternates: {
    canonical: "https://revealai.com", // Update this when you get your domain
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
import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

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
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Reveal AI - People Search",
    "url": "https://revealai-peoplesearch.com",
    "logo": "https://revealai-peoplesearch.com/logo.png",
    "description": "AI-powered people search, safety lookup, and privacy toolkit.",
    "applicationCategory": "UtilitiesApplication",
    "operatingSystem": "Web, iOS",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google Analytics 4 (GA4) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-KXNE8LSF4X"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-KXNE8LSF4X', {
                page_path: window.location.pathname,
                send_page_view: true
              });
            `,
          }}
        />
        {/* Meta Pixel (Facebook Pixel) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '1519956929082381');
              fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=1519956929082381&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Preload paywall header image for instant display */}
        <link rel="preload" href="/paywall-header.png" as="image" type="image/png" />
        {/* Preload paywall background image for instant display */}
        <link rel="preload" href="/paywall_image_reveal2.png" as="image" type="image/png" />
        {/* Preload hero background images to prevent layout shift - TEMPORARILY DISABLED */}
        {/* <link rel="preload" href="/New_Background_RevealAIMobile.png" as="image" type="image/png" media="(max-width: 768px)" />
        <link rel="preload" href="/New_Background_RevealAIWeb.png" as="image" type="image/png" media="(min-width: 769px)" /> */}
        {/* Favicon links for better browser and search engine support */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/favicon-192x192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body
        className={`${outfit.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
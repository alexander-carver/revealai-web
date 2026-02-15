import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog | RevealAI - Privacy Tips, Safety Guides & More",
  description:
    "Expert guides on online privacy, people search tips, dating safety, unclaimed money, and protecting your personal information.",
  keywords: [
    "privacy tips",
    "online safety",
    "data broker removal",
    "dating app safety",
    "people search guide",
    "unclaimed money",
    "identity protection",
  ],
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

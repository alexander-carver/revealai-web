import { buildToolMetadata } from "@/lib/search-products";

export const metadata = buildToolMetadata("social");

export default function SocialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

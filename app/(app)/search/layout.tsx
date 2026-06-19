import { buildToolMetadata } from "@/lib/search-products";

export const metadata = buildToolMetadata("people");

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

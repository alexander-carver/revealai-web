import { buildToolMetadata } from "@/lib/search-products";

export const metadata = buildToolMetadata("records");

export default function RecordsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

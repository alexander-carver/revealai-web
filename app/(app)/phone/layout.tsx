import { buildToolMetadata } from "@/lib/search-products";

export const metadata = buildToolMetadata("phone");

export default function PhoneLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

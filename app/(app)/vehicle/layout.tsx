import { buildToolMetadata } from "@/lib/search-products";

export const metadata = buildToolMetadata("vehicle");

export default function VehicleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

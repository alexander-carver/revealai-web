import { buildToolMetadata } from "@/lib/search-products";

export const metadata = buildToolMetadata("followers");

export default function FollowersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

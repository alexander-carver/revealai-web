import { AppLayout } from "@/components/shared/app-layout";

export default function AppRoutesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}


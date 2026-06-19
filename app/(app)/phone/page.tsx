import { redirect } from "next/navigation";
import { getSearchExperiencePath } from "@/lib/search-products";

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function PhoneLookupPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const number = readParam(params.number).trim();

  if (number) {
    redirect(
      `/search/result?type=phone&number=${encodeURIComponent(number)}`,
    );
  }

  redirect(getSearchExperiencePath("phone"));
}

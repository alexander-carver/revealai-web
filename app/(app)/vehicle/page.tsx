import { redirect } from "next/navigation";
import { getSearchExperiencePath } from "@/lib/search-products";

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function VehicleSearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const vin = readParam(params.vin).trim();
  const plate = readParam(params.plate).trim();

  if (vin || plate) {
    const resultParams = new URLSearchParams({ type: "vehicle" });

    if (vin) {
      resultParams.set("vin", vin);
    }

    if (!vin && plate) {
      resultParams.set("plate", plate);
    }

    redirect(`/search/result?${resultParams.toString()}`);
  }

  redirect(getSearchExperiencePath("vehicle"));
}

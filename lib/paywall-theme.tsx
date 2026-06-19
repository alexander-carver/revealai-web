import type { ReactNode } from "react";
import type { SearchProductId } from "./search-products";

export function getPaywallProductLabel(productId: SearchProductId) {
  switch (productId) {
    case "social":
      return "Dating Apps";
    case "followers":
      return "Followers Search";
    case "phone":
      return "Phone Search";
    case "vehicle":
      return "Vehicle Lookup";
    case "records":
      return "Public Records";
    default:
      return "Full Results";
  }
}

export function getPaywallBenefits(productId: SearchProductId): ReactNode[] {
  const productLabel = getPaywallProductLabel(productId);

  return [
    <>
      Unlock{" "}
      <span
        className="font-semibold text-lg"
        style={{ color: "var(--product-primary)" }}
      >
        {productLabel}
      </span>{" "}
      and full RevealAI access
    </>,
    <>Search people, phone numbers, vehicles, and public records from one account</>,
    <>Check public records, online profiles, and identity clues faster</>,
    <>
      Remove <span className="underline">yourself</span> from Reveal AI Search
    </>,
    <>
      Find unclaimed <span className="font-bold">money</span> for free
    </>,
  ];
}

import { ProductLandingPage } from "@/components/shared/product-landing-page";
import { buildLandingMetadata, getSearchProduct } from "@/lib/search-products";

export const metadata = buildLandingMetadata("people");

export default function PeopleSearchLandingPage() {
  return <ProductLandingPage product={getSearchProduct("people")} />;
}

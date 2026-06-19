import { ProductLandingPage } from "@/components/shared/product-landing-page";
import { buildLandingMetadata, getSearchProduct } from "@/lib/search-products";

export const metadata = buildLandingMetadata("social");

export default function DatingAppSearchLanding() {
  return <ProductLandingPage product={getSearchProduct("social")} />;
}

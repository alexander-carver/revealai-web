import { ProductLandingPage } from "@/components/shared/product-landing-page";
import { buildLandingMetadata, getSearchProduct } from "@/lib/search-products";

export const metadata = buildLandingMetadata("followers");

export default function FollowerSearchLanding() {
  return <ProductLandingPage product={getSearchProduct("followers")} />;
}

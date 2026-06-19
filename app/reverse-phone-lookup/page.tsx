import { ProductLandingPage } from "@/components/shared/product-landing-page";
import { buildLandingMetadata, getSearchProduct } from "@/lib/search-products";

export const metadata = buildLandingMetadata("phone");

export default function ReversePhoneLookupLanding() {
  return <ProductLandingPage product={getSearchProduct("phone")} />;
}

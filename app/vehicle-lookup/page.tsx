import { ProductLandingPage } from "@/components/shared/product-landing-page";
import { buildLandingMetadata, getSearchProduct } from "@/lib/search-products";

export const metadata = buildLandingMetadata("vehicle");

export default function VehicleLookupLandingPage() {
  return <ProductLandingPage product={getSearchProduct("vehicle")} />;
}

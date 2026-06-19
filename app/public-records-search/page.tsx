import { ProductLandingPage } from "@/components/shared/product-landing-page";
import { buildLandingMetadata, getSearchProduct } from "@/lib/search-products";

export const metadata = buildLandingMetadata("records");

export default function PublicRecordsSearchLandingPage() {
  return <ProductLandingPage product={getSearchProduct("records")} />;
}

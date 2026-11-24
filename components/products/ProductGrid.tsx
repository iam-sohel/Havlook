import ClientProductGrid from "./ClientProductGrid";
import { listProducts } from "@/services/productService";
import type { Product } from "@/types/product";

/**
 * Server-side catalogue loader. Product summaries are paginated in the
 * service layer; the client grid enriches only cards approaching the viewport.
 */
export default async function ProductGrid() {
  const list = await listProducts();

  const products: Product[] =
    list.source === "error" ? [] : list.products;

  return <ClientProductGrid products={products} />;
}

import { Grid } from "@mui/material";

import ProductCard from "./ProductCard";
import { listProducts } from "@/services/productService";
import { getProductImage } from "@/utils/productImages";
import type { Product } from "@/types/product";

/**
 * HAVLOOK — ProductGrid (Server Component).
 *
 * Renders the full product catalogue. The grid deliberately goes
 * through the service layer (not a direct product import) so
 * the data source can be swapped without touching the rendering code.
 *
 * Data flow:
 *   1. `listProducts()` hits the Spring Boot catalogue endpoint.
 *   2. The endpoint already returns detailed product DTOs, including
 *      images, variants, pricing and ratings. Re-fetching every product
 *      by ID would duplicate backend work without adding data.
 *   3. If the backend is unreachable, the grid renders empty — there is
 *      no mock fallback.
 *
 * The product card visual design is preserved.
 */
export default async function ProductGrid() {
  const list = await listProducts();

  const products: Product[] =
    list.source === "error" ? [] : list.products;

  return (
    <Grid container spacing={3}>
      {products.map((product) => {
        const image = getProductImage(product);
        const offer =
          product.discount && product.discount > 0
            ? `${product.discount}% OFF`
            : "Best Price";

        return (
          <Grid
            key={product.id}
            size={{
              xs: 6,
              sm: 6,
              md: 4,
              lg: 3,
            }}
          >
            <ProductCard
              id={product.id}
              slug={product.slug}
              image={image}
              title={product.title}
              price={product.price}
              originalPrice={product.originalPrice}
              offer={offer}
              rating={product.rating}
              brand={product.brand}
              bestseller={product.bestseller}
              newArrival={product.newArrival}
            />
          </Grid>
        );
      })}
    </Grid>
  );
}

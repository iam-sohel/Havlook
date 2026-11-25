import { Box, Typography, Container } from "@mui/material";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CategoryBar from "@/components/home/CategoryBar";
import Hero from "@/components/home/Hero";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import DealsSection from "@/components/home/DealsSection";
import ElectronicsSection from "@/components/home/ElectronicsSection";
import FashionSection from "@/components/home/FashionSection";
import Newsletter from "@/components/home/Newsletter";

import {
  enrichProductListWithDetails,
  getProductsBySubCategory,
  listProducts,
} from "@/services/productService";
import type { Product } from "@/types/product";

/**
 * HAVLOOK - Home page (Server Component).
 *
 * Backend is the single source of truth for product data.
 * Catalogue and mobile deal requests run in parallel; only mobile deal
 * candidates receive bounded detail enrichment.
 */
export default async function HomePage() {
  /* -------------------------- Fetch products ---------------------------- */

  const MOBILE_SUBCATEGORY_ID = 1;

  const homepageStartedAt = Date.now();

  const timedCatalogue = async () => {
    const startedAt = Date.now();
    const value = await listProducts();
    console.info("[HAVLOOK_HOME_TIMING] listProducts", {
      durationMs: Date.now() - startedAt,
      source: value.source,
      productCount: value.source === "backend" ? value.products.length : 0,
    });
    return value;
  };

  const timedMobileDeals = async () => {
    const startedAt = Date.now();
    const mobileResult = await getProductsBySubCategory(MOBILE_SUBCATEGORY_ID);
    const subcategoryDurationMs = Date.now() - startedAt;

    if (!mobileResult.ok) {
      console.info("[HAVLOOK_HOME_TIMING] mobile subcategory", {
        durationMs: subcategoryDurationMs,
        ok: false,
      });
      return [];
    }

    const enrichmentStartedAt = Date.now();
    const products = await enrichProductListWithDetails(mobileResult.data, {
      concurrency: 8,
    });
    console.info("[HAVLOOK_HOME_TIMING] mobile pipeline", {
      subcategoryDurationMs,
      enrichmentDurationMs: Date.now() - enrichmentStartedAt,
      totalDurationMs: Date.now() - startedAt,
      candidateCount: mobileResult.data.length,
      enrichedCount: products.length,
    });
    return products;
  };

  const [result, enrichedMobileProducts] = await Promise.all([
    timedCatalogue(),
    timedMobileDeals(),
  ]);

  console.info("[HAVLOOK_HOME_TIMING] data phase total", {
    durationMs: Date.now() - homepageStartedAt,
  });

  const allProducts: Product[] =
    result.source === "backend" ? result.products : [];

  const hasProducts = allProducts.length > 0;
  const featuredProducts = allProducts.slice(0, 5);

  /* ----------------------------- Hero subset ---------------------------- */

  const heroProduct =
    allProducts.find(
      (product) =>
        typeof product.discount === "number" &&
        product.discount > 0,
    ) ?? allProducts[0];

  /* --------------------------- Featured subset -------------------------- */


  /* ----------------------------- Deals subset --------------------------- */

  const dealProducts = enrichedMobileProducts
    .filter((product) => {
      const hasValidDiscount =
        typeof product.discount === "number" &&
        Number.isFinite(product.discount) &&
        product.discount > 0 &&
        product.discount <= 100;

      const hasValidPrice =
        Number(product.originalPrice) > Number(product.price) &&
        product.price > 0;
      return (
        Number(product.subCategoryId) === MOBILE_SUBCATEGORY_ID &&
        hasValidDiscount && hasValidPrice
      );
    })
    .slice(0, 8)
    .map((product) => ({
      ...product,
      offer: `${product.discount}% OFF`,
    }));

  /* ------------------------ Electronics subset -------------------------- */

  const ELECTRONICS_CATEGORIES = new Set([
    "Mobiles",
    "Laptops",
    "Tablets",
    "Audio",
    "Televisions",
    "Gaming",
  ]);

  const normalizeCategory = (category?: string | null) =>
    (category ?? "").trim().toLocaleLowerCase("en-IN");

  const electronicsCategoryKeys = new Set(
    Array.from(ELECTRONICS_CATEGORIES, normalizeCategory),
  );

  const electronicsProducts = allProducts
    .filter((product) =>
      electronicsCategoryKeys.has(
        normalizeCategory(product.category),
      ),
    )
    .slice(0, 8);

  /* -------------------------- Fashion subset ---------------------------- */

  const FASHION_CATEGORIES = new Set([
    "Men's Fashion",
    "Women's Fashion",
    "Footwear",
  ]);

  const fashionCategoryKeys = new Set(
    Array.from(FASHION_CATEGORIES, normalizeCategory),
  );

  const fashionProducts = allProducts
    .filter((product) =>
      fashionCategoryKeys.has(
        normalizeCategory(product.category),
      ),
    )
    .slice(0, 8);

  /* ------------------------------- Render -------------------------------- */

  return (
    <>
      <Header />

      <Box
        sx={{
          bgcolor: "background.default",
          pb: { xs: 2, sm: 3 },
          width: "100%",
          maxWidth: "100%",
          overflowX: "hidden",
        }}
      >
        {/* Categories */}
        <Box
          sx={{
            pt: { xs: 1, sm: 1.5 },
            width: "100%",
            maxWidth: "100%",
          }}
        >
          <CategoryBar />
        </Box>

        {heroProduct ? (
          <Hero product={heroProduct} />
        ) : null}

        {/* Homepage Sections */}
        {hasProducts ? (
          <>
            <FeaturedProducts products={featuredProducts} />
            <DealsSection products={dealProducts} />
            <ElectronicsSection products={electronicsProducts} />
            <FashionSection products={fashionProducts} />
          </>
        ) : (
          <Container maxWidth="xl" sx={{ py: 6 }}>
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, mb: 2 }}
            >
              Products are temporarily unavailable
            </Typography>

            <Typography color="text.secondary">
              We could not reach the product catalogue. Please
              try again in a moment.
            </Typography>
          </Container>
        )}

        <Newsletter />
      </Box>

      <Footer />
    </>
  );
}

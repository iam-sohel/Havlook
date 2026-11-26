import { Suspense } from "react";
import { Box, Typography, Container, Skeleton } from "@mui/material";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CategoryBar from "@/components/home/CategoryBar";
import Hero from "@/components/home/Hero";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import DealsSection from "@/components/home/DealsSection";
import ElectronicsSection from "@/components/home/ElectronicsSection";
import FashionSection from "@/components/home/FashionSection";
import Newsletter from "@/components/home/Newsletter";

import { listProducts } from "@/services/productService";
import type { Product } from "@/types/product";

/**
 * Loads backend catalogue data inside a Suspense boundary.
 * Keeping this async work below the page shell allows Next.js to stream
 * the header and category navigation before the catalogue request finishes.
 */
async function HomepageCatalogueSections() {
  const MOBILE_SUBCATEGORY_ID = 1;

  const homepageStartedAt = Date.now();
  const result = await listProducts({ size: 50 });
  console.info("[HAVLOOK_HOME_TIMING] catalogue", {
    durationMs: Date.now() - homepageStartedAt,
    source: result.source,
    productCount: result.source === "backend" ? result.products.length : 0,
  });

  const allProducts: Product[] =
    result.source === "backend" ? result.products : [];

  const hasProducts = allProducts.length > 0;
  const featuredProducts = allProducts.slice(0, 5);

  const heroProduct =
    allProducts.find(
      (product) =>
        typeof product.discount === "number" &&
        product.discount > 0,
    ) ?? allProducts[0];

  const dealProducts = allProducts
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
        hasValidDiscount &&
        hasValidPrice
      );
    })
    .slice(0, 8)
    .map((product) => ({
      ...product,
      offer: `${product.discount}% OFF`,
    }));

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
      electronicsCategoryKeys.has(normalizeCategory(product.category)),
    )
    .slice(0, 8);

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
      fashionCategoryKeys.has(normalizeCategory(product.category)),
    )
    .slice(0, 8);

  if (!hasProducts) {
    return (
      <Container maxWidth="xl" sx={{ py: 6 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
          Products are temporarily unavailable
        </Typography>
        <Typography color="text.secondary">
          We could not reach the product catalogue. Please try again in a moment.
        </Typography>
      </Container>
    );
  }

  return (
    <>
      {heroProduct ? <Hero product={heroProduct} /> : null}
      <FeaturedProducts products={featuredProducts} />
      <DealsSection products={dealProducts} />
      <ElectronicsSection products={electronicsProducts} />
      <FashionSection products={fashionProducts} />
    </>
  );
}

function HomepageCatalogueFallback() {
  return (
    <Box
      role="status"
      aria-label="Loading homepage products"
      sx={{
        px: { xs: 2, sm: 3, md: 5 },
        pt: { xs: 2, md: 3 },
        minHeight: { xs: 760, md: 680 },
      }}
    >
      <Skeleton
        variant="rounded"
        height={260}
        sx={{ borderRadius: 3, mb: 3 }}
      />
      <Skeleton variant="text" width="36%" height={38} sx={{ mb: 1 }} />
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 2,
        }}
      >
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton
            key={index}
            variant="rounded"
            height={{ xs: 190, sm: 220, md: 250 }}
            sx={{ borderRadius: 2 }}
          />
        ))}
      </Box>
    </Box>
  );
}

/**
 * HAVLOOK — Home page (Server Component).
 *
 * The shell streams immediately; only backend-dependent catalogue sections
 * wait for the single batched catalogue request.
 */
export default function HomePage() {
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
        <Box
          sx={{
            pt: { xs: 1, sm: 1.5 },
            width: "100%",
            maxWidth: "100%",
          }}
        >
          <CategoryBar />
        </Box>

        <Suspense fallback={<HomepageCatalogueFallback />}>
          <HomepageCatalogueSections />
        </Suspense>

        <Newsletter />
      </Box>
      <Footer />
    </>
  );
}

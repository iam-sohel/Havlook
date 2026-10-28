import { notFound } from "next/navigation";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ClientProductGrid from "@/components/products/ClientProductGrid";

import {
  Alert,
  Box,
  Container,
  Typography,
} from "@mui/material";

import categories from "@/data/categories";

import { listCategories } from "@/services/catalogService";

import {
  getProductsByCategory,
  enrichProductListWithDetails,
  type Product,
} from "@/services/productService";

type PageProps = {
  params: Promise<{ slug: string }>;
};

/**
 * Maps storefront navigation categories to real backend category names.
 */
const BACKEND_CATEGORY_NAMES: Record<string, string[]> = {
  mobiles: ["electronics"],
  fashion: [
    "fashion",
    "men's clothing",
    "men's shoes",
    "women's clothing",
    "women's shoes",
    "kids' fashion",
  ],
  electronics: ["electronics", "tv, audio & cameras"],
  appliances: ["appliances"],
  "home-kitchen": ["home & kitchen", "home, kitchen, pets"],
  beauty: ["beauty & health", "beauty & personal care"],
  grocery: ["grocery & gourmet foods"],
  books: ["books"],
  sports: ["sports & fitness"],
  furniture: ["furniture"],
  toys: ["toys & baby products"],
  automotive: ["car & motorbike"],
};

function normalizeName(value: string): string {
  return value.trim().toLocaleLowerCase("en-IN");
}

function EmptyProducts() {
  return (
    <Box sx={{ textAlign: "center", py: 6 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
        No Products Found
      </Typography>

      <Typography color="text.secondary">
        There are no products in this category at the moment.
      </Typography>
    </Box>
  );
}

export default async function CategoryPage(props: PageProps) {
  const { slug } = await props.params;

  const storefrontCategory = categories.find(
    (item) => item.slug === slug,
  );

  if (!storefrontCategory) {
    notFound();
  }

  // Resolve the storefront category to actual backend category IDs.
  const categoryResult = await listCategories();

  if (!categoryResult.ok) {
    return (
      <>
        <Header />

        <Container maxWidth="xl" sx={{ py: 6 }}>
          <Alert severity="error">
            Failed to load backend categories: {categoryResult.message}
          </Alert>
        </Container>

        <Footer />
      </>
    );
  }

  const allowedNames = new Set(
    (
      BACKEND_CATEGORY_NAMES[slug] ??
      [storefrontCategory.title]
    ).map(normalizeName),
  );

  const backendCategories = categoryResult.data.filter(
    (item) =>
      allowedNames.has(normalizeName(item.name)) &&
      item.status?.toUpperCase() !== "INACTIVE",
  );

  // Load products using backend category IDs rather than blank category names.
  const categoryResults = await Promise.all(
    backendCategories.map((item) =>
      getProductsByCategory(item.id),
    ),
  );

  const productsById = new Map<string, Product>();
  let firstRequestError: string | undefined;

  for (const result of categoryResults) {
    if (!result.ok) {
      firstRequestError ??= result.message;
      continue;
    }

    for (const product of result.data) {
      productsById.set(String(product.id), product);
    }
  }

  const productSummaries = Array.from(productsById.values());

  if (
    backendCategories.length > 0 &&
    productSummaries.length === 0 &&
    firstRequestError
  ) {
    return (
      <>
        <Header />

        <Container maxWidth="xl" sx={{ py: 6 }}>
          <Alert severity="error">
            Failed to load category products: {firstRequestError}
          </Alert>
        </Container>

        <Footer />
      </>
    );
  }

  // Limit detail requests to avoid overwhelming the backend.
  const enrichedProducts = await enrichProductListWithDetails(
    productSummaries.slice(0, 40),
  );

  return (
    <>
      <Header />

      <Container maxWidth="xl" sx={{ py: 6 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {storefrontCategory.title}
          </Typography>

          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Browse all products in {storefrontCategory.title}.
          </Typography>
        </Box>

        {enrichedProducts.length > 0 ? (
          <ClientProductGrid products={enrichedProducts} />
        ) : (
          <EmptyProducts />
        )}
      </Container>

      <Footer />
    </>
  );
}
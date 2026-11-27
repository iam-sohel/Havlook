"use client";

import { useEffect, useRef, useState } from "react";
import { Grid } from "@mui/material";

import ProductCard from "./ProductCard";
import { getProductDetailsById } from "@/services/productService";
import { createBoundedAsyncCache } from "@/services/boundedAsyncCache";
import { getProductImage } from "@/utils/productImages";
import type { Product } from "@/types/product";

interface CategoryProductGridProps {
  products: Product[];
}

interface PendingDetailsRequest {
  id: string;
  resolve: (product: Product | null) => void;
}

const MAX_DETAIL_REQUESTS = 3;
const MAX_CACHED_DETAILS = 200;
const pendingDetails: PendingDetailsRequest[] = [];
const detailCache = createBoundedAsyncCache<Product>(MAX_CACHED_DETAILS);
let activeDetailRequests = 0;

function loadProductDetails(id: string): Promise<Product | null> {
  return detailCache.getOrLoad(
    id,
    () =>
      new Promise<Product | null>((resolve) => {
        pendingDetails.push({ id, resolve });
        processPendingDetails();
      }),
  );
}

function processPendingDetails(): void {
  while (
    activeDetailRequests < MAX_DETAIL_REQUESTS &&
    pendingDetails.length > 0
  ) {
    const job = pendingDetails.shift();
    if (!job) return;

    activeDetailRequests += 1;

    void getProductDetailsById(job.id)
      .then((result) => {
        job.resolve(result.ok ? result.data : null);
      })
      .catch(() => {
        job.resolve(null);
      })
      .finally(() => {
        activeDetailRequests -= 1;
        processPendingDetails();
      });
  }
}

function LazyProductCard({ product }: { product: Product }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [resolvedProduct, setResolvedProduct] = useState(product);
  const [detailsLoading, setDetailsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const element = cardRef.current;

    const loadDetails = () => {
      void loadProductDetails(String(product.id))
        .then((details) => {
          if (mounted && details) setResolvedProduct(details);
        })
        .finally(() => {
          if (mounted) setDetailsLoading(false);
        });
    };

    if (!element || typeof IntersectionObserver === "undefined") {
      loadDetails();
      return () => {
        mounted = false;
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          loadDetails();
        }
      },
      { rootMargin: "400px 0px" },
    );

    observer.observe(element);

    return () => {
      mounted = false;
      observer.disconnect();
    };
  }, [product.id]);

  const image = getProductImage(resolvedProduct);
  const offer =
    resolvedProduct.discount && resolvedProduct.discount > 0
      ? `${resolvedProduct.discount}% OFF`
      : "Best Price";

  return (
    <Grid
      ref={cardRef}
      size={{
        xs: 6,
        sm: 6,
        md: 4,
        lg: 3,
      }}
    >
      <ProductCard
        id={resolvedProduct.id}
        slug={resolvedProduct.slug}
        image={image}
        title={resolvedProduct.title}
        price={resolvedProduct.price}
        originalPrice={resolvedProduct.originalPrice}
        offer={offer}
        rating={resolvedProduct.rating}
        brand={resolvedProduct.brand}
        bestseller={resolvedProduct.bestseller}
        newArrival={resolvedProduct.newArrival}
        detailsLoading={detailsLoading}
      />
    </Grid>
  );
}

export default function CategoryProductGrid({
  products,
}: CategoryProductGridProps) {
  return (
    <Grid container spacing={3}>
      {products.map((product) => (
        <LazyProductCard key={product.id} product={product} />
      ))}
    </Grid>
  );
}
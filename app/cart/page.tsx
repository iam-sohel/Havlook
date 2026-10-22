"use client";

import { useEffect, useState } from "react";

import {
  Alert,
  Box,
  Container,
  Grid,
  Typography,
} from "@mui/material";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

import CartItemRow from "@/components/cart/CartItemRow";
import CartOrderSummary from "@/components/cart/CartOrderSummary";
import CartSkeleton from "@/components/cart/CartSkeleton";
import CartEmptyState from "@/components/cart/CartEmptyState";

import useCartStore from "@/store/cartStore";
import useAuthStore from "@/store/authStore";

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const increaseQuantity = useCartStore((s) => s.increaseQuantity);
  const decreaseQuantity = useCartStore((s) => s.decreaseQuantity);
  const removeFromCart = useCartStore((s) => s.removeFromCart);
  const fetchCart = useCartStore((s) => s.fetchCart);

  const serverGrandTotal = useCartStore((s) => s.serverGrandTotal);
  const serverProductPrice = useCartStore((s) => s.serverProductPrice);
  const serverTotalDiscount = useCartStore((s) => s.serverTotalDiscount);
  const serverDeliveryCharge = useCartStore(
    (s) => s.serverDeliveryCharge,
  );

  const error = useCartStore((s) => s.error);
  const clearError = useCartStore((s) => s.clearError);
  const loading = useCartStore((s) => s.loading);

  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (token) {
      void fetchCart();
    }
  }, [token, fetchCart]);

  const [lastClickedRowId, setLastClickedRowId] = useState<
    number | string | null
  >(null);

  const isRowBusy = (rowId: number | string) =>
    loading && lastClickedRowId === rowId;

  const itemCount = items.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  return (
    <>
      <Header />

      {loading && items.length === 0 ? (
        <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
          <CartSkeleton />
        </Container>
      ) : items.length === 0 ? (
        <CartEmptyState
          error={error}
          onDismissError={clearError}
          onRetry={token ? () => void fetchCart() : undefined}
        />
      ) : (
        <Container maxWidth="lg" sx={{ py: { xs: 2.5, md: 4 } }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "baseline",
              flexWrap: "wrap",
              rowGap: 0.5,
              mb: { xs: 2, md: 3 },
            }}
          >
            <Typography
              component="h1"
              sx={{
                fontWeight: 700,
                fontSize: { xs: "1.25rem", md: "1.5rem" },
              }}
            >
              Shopping Cart
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ ml: 1.5 }}
            >
              ({itemCount} {itemCount === 1 ? "item" : "items"})
            </Typography>
          </Box>

          {error && (
            <Alert
              severity="error"
              onClose={clearError}
              sx={{ mb: 2.5 }}
            >
              {error}
            </Alert>
          )}

          <Grid container spacing={{ xs: 2.5, md: 4 }}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Box
                sx={{
                  bgcolor: "background.paper",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: { xs: 2, md: 3 },
                  px: { xs: 1.5, sm: 2.5, md: 3 },
                  py: 1,
                  minWidth: 0,
                }}
              >
                {items.map((item, index) => (
                  <Box
                    key={item.id}
                    sx={{
                      borderBottom:
                        index < items.length - 1
                          ? "1px solid"
                          : "none",
                      borderColor: "divider",
                    }}
                  >
                    <CartItemRow
                      item={item}
                      busy={isRowBusy(item.id)}
                      disabled={loading && !isRowBusy(item.id)}
                      onIncrease={() => {
                        setLastClickedRowId(item.id);
                        increaseQuantity(item.id, {});
                      }}
                      onDecrease={() => {
                        if (item.quantity <= 1) return;

                        setLastClickedRowId(item.id);
                        decreaseQuantity(item.id, {});
                      }}
                      onRemove={() => {
                        setLastClickedRowId(item.id);
                        void removeFromCart(item.id);
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <CartOrderSummary
                productPrice={serverProductPrice}
                totalDiscount={serverTotalDiscount}
                orderTotal={serverGrandTotal}
                deliveryCharge={serverDeliveryCharge}
                itemCount={itemCount}
                updating={loading}
              />
            </Grid>
          </Grid>
        </Container>
      )}

      <Footer />
    </>
  );
}
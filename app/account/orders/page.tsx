"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

import useRequireAuth from "@/hooks/useRequireAuth";
import { getOrders } from "@/services/orderService";
import type { OrderResponseWire } from "@/services/orderService";
import { formatPrice } from "@/utils/formatPrice";
import { OrderEmptyState, OrderLoadingState } from "@/components/orders/OrderStates";
import OrderStatusChip from "@/components/orders/OrderStatusChip";
import OrderItem from "@/components/orders/OrderItem";

type Order = OrderResponseWire;

function formatDate(value?: string | null): string {
  if (!value) {
    return "Date unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatMoney(value?: string | number | null): string {
  if (value === null || value === undefined || value === "") {
    return "0";
  }

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return "0";
  }

  return formatPrice(numberValue);
}

const STATUS_CHIPS: Array<{ value: string; label: string }> = [
  { value: "ALL", label: "All orders" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "PROCESSING", label: "Processing" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default function OrdersPage() {
  const { checking, authed } = useRequireAuth("/account/orders");

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const loadOrders = useCallback(async () => {
    if (checking || !authed) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await getOrders();

      if ("data" in response && response.data) {
        setOrders(response.data);
        return;
      }

      setOrders([]);

      if ("message" in response && response.message) {
        setError(response.message);
      } else {
        setError("Unable to load your orders.");
      }
    } catch {
      setOrders([]);
      setError("Unable to load your orders. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [checking, authed]);

  useEffect(() => {
    if (checking || !authed) {
      return;
    }

    const timer = window.setTimeout(() => {
      void loadOrders();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [checking, authed, loadOrders]);

  const availableStatuses = useMemo(() => {
    const found = new Set<string>();
    for (const order of orders) {
      if (order.status) {
        found.add(String(order.status).toUpperCase());
      }
    }
    return STATUS_CHIPS.filter((chip) => chip.value === "ALL" || found.has(chip.value));
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    const status = statusFilter;

    return orders.filter((order) => {
      const matchesSearch =
        !query ||
        order.orderNumber.toLowerCase().includes(query) ||
        order.shippingFullName?.toLowerCase().includes(query) ||
        order.shippingPhoneNumber?.toLowerCase().includes(query) ||
        order.shippingCity?.toLowerCase().includes(query);

      const matchesStatus =
        status === "ALL" ||
        String(order.status).toUpperCase() === status;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  if (checking || (!authed && !loading)) {
    return null;
  }

  return (
    <>
      <Header />

      <Box
        component="main"
        sx={{
          minHeight: "70vh",
          py: { xs: 3, sm: 4, md: 6 },
          backgroundColor: "background.default",
        }}
      >
        <Container maxWidth="lg">
          <Stack spacing={3} sx={{ mb: 4 }}>
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: "1.7rem", sm: "2rem", md: "2.25rem" },
                }}
              >
                My Orders
              </Typography>

              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                Track your recent orders and view order details.
              </Typography>
            </Box>
          </Stack>

          {error && (
            <Alert
              severity="error"
              sx={{ mb: 3 }}
              action={
                <Button color="inherit" size="small" onClick={loadOrders}>
                  Retry
                </Button>
              }
            >
              {error}
            </Alert>
          )}

          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search orders by order number, customer, phone or city"
                  helperText="Searches your loaded orders"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  sx={{
                    minHeight: 44,
                    "& .MuiOutlinedInput-root": { minHeight: 44 },
                  }}
                />

                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 1,
                    minWidth: 0,
                  }}
                >
                  {availableStatuses.map((chip) => {
                    const active = statusFilter === chip.value;
                    return (
                      <Button
                        key={chip.value}
                        variant={active ? "contained" : "outlined"}
                        color={active ? "primary" : "inherit"}
                        size="small"
                        onClick={() => setStatusFilter(chip.value)}
                        sx={{
                          minHeight: 44,
                          textTransform: "none",
                          fontWeight: 600,
                          ...(active
                            ? {
                                bgcolor: "primary.main",
                                color: "primary.contrastText",
                                "&:hover": { bgcolor: "primary.dark" },
                              }
                            : {}),
                        }}
                      >
                        {chip.label}
                      </Button>
                    );
                  })}
                </Box>

                <Button
                  variant="outlined"
                  onClick={loadOrders}
                  disabled={loading}
                  sx={{ minHeight: 44, minWidth: 100 }}
                >
                  {loading ? "Refreshing…" : "Refresh"}
                </Button>
              </Stack>
            </CardContent>
          </Card>

          {loading ? (
            <OrderLoadingState cards={3} />
          ) : filteredOrders.length === 0 ? (
            <OrderEmptyState
              title={
                search || statusFilter !== "ALL"
                  ? "No matching orders"
                  : "No orders yet"
              }
              description={
                search || statusFilter !== "ALL"
                  ? "Try changing your search or status filter."
                  : "Your completed orders will appear here."
              }
              action={
                search || statusFilter !== "ALL" ? null : (
                  <Button
                    component="a"
                    href="/products"
                    variant="contained"
                    sx={{ minHeight: 44 }}
                  >
                    Start Shopping
                  </Button>
                )
              }
            />
          ) : (
            <Grid container spacing={3}>
              {filteredOrders.map((order) => {
                const items = order.items || [];
                const visibleItems = items.slice(0, 3);
                const remainingItems = Math.max(items.length - 3, 0);

                const paymentMethod =
                  order.paymentMethod === "COD"
                    ? "Cash on Delivery"
                    : order.paymentMethod === "ONLINE"
                      ? "Online Payment"
                      : "—";

                return (
                  <Grid
                    key={order.id}
                    size={{ xs: 12, sm: 6, lg: 4 }}
                    sx={{ display: "flex" }}
                  >
                    <Card sx={{ height: "100%", borderRadius: 3, overflow: "hidden" }}>
                      <CardContent sx={{ p: { xs: 2.5, sm: 3 }, display: "flex", flexDirection: "column", height: "100%" }}>
                        <Stack spacing={1}>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              gap: 1,
                            }}
                          >
                            <Box sx={{ minWidth: 0 }}>
                              <Typography
                                variant="h6"
                                sx={{
                                  fontWeight: 700,
                                  overflowWrap: "anywhere",
                                  minWidth: 0,
                                }}
                              >
                                Order {order.orderNumber || `#${order.id}`}
                              </Typography>

                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Placed {formatDate(order.createdAt)}
                              </Typography>
                            </Box>

                            <OrderStatusChip status={order.status} />
                          </Box>

                          <Divider sx={{ my: 2 }} />

                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              variant="subtitle2"
                              sx={{ mb: 1, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}
                            >
                              Items
                            </Typography>

                            <Stack spacing={1}>
                              {visibleItems.map((item) => (
                                <OrderItem
                                  key={item.id}
                                  item={{
                                    ...item,
                                    image: undefined,
                                  }}
                                  showThumbnail
                                />
                              ))}

                              {remainingItems > 0 && (
                                <Typography variant="body2" color="text.secondary">
                                  + {remainingItems} more item{remainingItems > 1 ? "s" : ""}
                                </Typography>
                              )}

                              {items.length === 0 && (
                                <Typography variant="body2" color="text.secondary">
                                  No item information available.
                                </Typography>
                              )}
                            </Stack>
                          </Box>

                          <Divider sx={{ my: 2 }} />

                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              variant="subtitle2"
                              sx={{ mb: 0.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}
                            >
                              Order Total
                            </Typography>

                            <Typography variant="h5" sx={{ fontWeight: 700 }}>
                              {formatMoney(order.totalAmount)}
                            </Typography>

                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                mt: 1,
                              }}
                            >
                              <Chip
                                size="small"
                                label={
                                  order.paymentStatus
                                    ? String(order.paymentStatus)
                                        .replace(/_/g, " ")
                                        .toLowerCase()
                                        .replace(/\b\w/g, (c) => c.toUpperCase())
                                    : "—"
                                }
                                sx={{ fontWeight: 600 }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                {paymentMethod}
                              </Typography>
                            </Box>
                          </Box>
                        </Stack>

                        <Box
                          sx={{
                            marginTop: "auto",
                            display: "flex",
                            justifyContent: "flex-end",
                          }}
                        >
                          <Button
                            variant="outlined"
                            href={"/account/orders/" + order.id}
                            sx={{ minHeight: 44 }}
                          >
                            View Details
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Container>
      </Box>

      <Footer />
    </>
  );
}

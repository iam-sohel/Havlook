"use client";

import { useCallback, useEffect, useState } from "react";

import {
  Alert,
  Breadcrumbs,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  Link as MuiLink,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Stack,
  Typography,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import HomeIcon from "@mui/icons-material/Home";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useParams, useRouter } from "next/navigation";

import {
  getAdminOrder,
  updateAdminOrderStatus,
  type AdminOrder,
} from "@/services/adminOrderService";

import { AdminErrorState } from "@/components/admin/AdminStates";
import { OrderLoadingState } from "@/components/orders/OrderStates";
import OrderStatusChip from "@/components/orders/OrderStatusChip";
import OrderItem from "@/components/orders/OrderItem";
import OrderTimeline from "@/components/orders/OrderTimeline";
import PriceBreakdown from "@/components/orders/PriceBreakdown";

const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
  "REFUNDED",
];

function formatDate(value: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getPaymentColor(status: string) {
  switch (status.toUpperCase()) {
    case "PAID":
      return "success";
    case "FAILED":
    case "CANCELLED":
      return "error";
    case "PENDING":
      return "warning";
    case "REFUNDED":
      return "info";
    default:
      return "default";
  }
}

export default function AdminOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const orderId = Number(params.id);

  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  const loadOrder = useCallback(async () => {
    if (!orderId || Number.isNaN(orderId)) {
      setError("Invalid order ID.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result = await getAdminOrder(orderId);

      setOrder(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load order details.",
      );
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (cancelled) return;
      await loadOrder();
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [loadOrder]);

  const handleStatusChange = async (event: SelectChangeEvent) => {
    if (!order) return;

    const newStatus = event.target.value;

    if (!newStatus || newStatus === order.status) {
      return;
    }

    try {
      setUpdating(true);
      setError("");

      const updatedOrder = await updateAdminOrderStatus(order.id, newStatus);

      setOrder(updatedOrder);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update order status.",
      );
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ px: { xs: 2, md: 3 }, py: 4 }}>
        <OrderLoadingState cards={3} />
      </Box>
    );
  }

  if (error && !order) {
    return (
      <Box sx={{ px: { xs: 2, md: 3 }, py: 4 }}>
        <AdminErrorState message={error} onRetry={() => void loadOrder()} />
        <Box sx={{ mt: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push("/admin/orders")}
            sx={{ minHeight: 44 }}
          >
            Back to Orders
          </Button>
        </Box>
      </Box>
    );
  }

  if (!order) {
    return (
      <Box sx={{ px: 3 }}>
        <Alert severity="warning">Order not found.</Alert>
      </Box>
    );
  }

  const shippingAddress = [
    order.shippingStreetAddress,
    order.shippingLandmark,
    order.shippingCity,
    order.shippingState,
    order.shippingPostalCode,
    order.shippingCountry,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, py: 4 }}>
      <Breadcrumbs
        sx={{
          mb: 2,
          "& .MuiBreadcrumbs-ol": { flexWrap: "wrap", rowGap: 0.5 },
        }}
      >
        <MuiLink
          component="button"
          underline="hover"
          color="inherit"
          onClick={() => router.push("/admin")}
          sx={{ border: 0, background: "transparent", cursor: "pointer" }}
        >
          <HomeIcon fontSize="small" />
          Admin
        </MuiLink>

        <MuiLink
          component="button"
          underline="hover"
          color="inherit"
          onClick={() => router.push("/admin/orders")}
          sx={{ border: 0, background: "transparent", cursor: "pointer" }}
        >
          Orders
        </MuiLink>

        <Typography color="text.primary" sx={{ overflowWrap: "anywhere" }}>
          {order.orderNumber || `#${order.id}`}
        </Typography>
      </Breadcrumbs>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          mb: 3,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", md: "center" },
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, overflowWrap: "anywhere", minWidth: 0 }}
          >
            Order {order.orderNumber || `#${order.id}`}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Created {formatDate(order.createdAt)}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => void loadOrder()}
            disabled={loading || updating}
            sx={{ minHeight: 44 }}
          >
            Refresh
          </Button>

          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push("/admin/orders")}
            sx={{ minHeight: 44 }}
          >
            Back to Orders
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={2}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 2,
                  mb: 2,
                  flexWrap: "wrap",
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Order Items
                </Typography>
                <OrderStatusChip status={order.status} />
              </Box>

              <OrderTimeline status={order.status} />

              <Box sx={{ mt: 2 }}>
                {order.items.length === 0 ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ textAlign: "center", py: 3 }}
                  >
                    No items found for this order.
                  </Typography>
                ) : (
                  <Stack spacing={1.5}>
                    {order.items.map((item) => (
                      <OrderItem
                        key={item.id}
                        item={{
                          productName: item.productName,
                          sku: item.sku,
                          quantity: item.quantity,
                          unitSellingPrice: item.unitSellingPrice,
                          lineTotal: item.lineTotal,
                          status: order.status,
                        }}
                        showThumbnail
                        showStatus
                      />
                    ))}
                  </Stack>
                )}
              </Box>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Shipping Information
              </Typography>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    Recipient
                  </Typography>
                  <Typography sx={{ fontWeight: 600, mt: 0.5 }}>
                    {order.shippingFullName || "—"}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    Phone
                  </Typography>
                  <Typography sx={{ fontWeight: 600, mt: 0.5 }}>
                    {order.shippingPhoneNumber || "—"}
                  </Typography>
                </Grid>
                <Grid size={12}>
                  <Typography variant="body2" color="text.secondary">
                    Address
                  </Typography>
                  <Typography
                    sx={{
                      fontWeight: 600,
                      mt: 0.5,
                      overflowWrap: "anywhere",
                    }}
                  >
                    {shippingAddress || "—"}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Payment Information
              </Typography>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Payment Method
                  </Typography>
                  <Typography sx={{ fontWeight: 600, mt: 0.5 }}>
                    {order.paymentMethod || "—"}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Payment Status
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      size="small"
                      label={order.paymentStatus || "UNKNOWN"}
                      color={getPaymentColor(order.paymentStatus)}
                    />
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Payment Expires
                  </Typography>
                  <Typography sx={{ fontWeight: 600, mt: 0.5 }}>
                    {formatDate(order.paymentExpiresAt || "")}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={2}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Order Status
              </Typography>

              <FormControl fullWidth>
                <InputLabel id="admin-order-status-label">
                  Status
                </InputLabel>

                <Select
                  labelId="admin-order-status-label"
                  value={order.status}
                  label="Status"
                  disabled={updating}
                  onChange={handleStatusChange}
                  sx={{ "&.MuiOutlinedInput-root": { minHeight: 44 } }}
                >
                  {ORDER_STATUSES.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {updating && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mt: 2,
                  }}
                >
                  <CircularProgress size={18} />
                  <Typography variant="body2" color="text.secondary">
                    Updating order status…
                  </Typography>
                </Box>
              )}
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Price Summary
              </Typography>

              <PriceBreakdown
                subtotal={order.subtotal}
                discountAmount={order.discountAmount}
                shippingCharge={order.shippingCharge}
                taxAmount={order.taxAmount}
                totalAmount={order.totalAmount}
                currency={order.currency}
              />
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Order Timeline
              </Typography>

              <Stack spacing={1}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 2,
                    py: 1,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Created
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, textAlign: "right", minWidth: 0 }}
                  >
                    {formatDate(order.createdAt)}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 2,
                    py: 1,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, textAlign: "right", minWidth: 0 }}
                  >
                    {formatDate(order.updatedAt)}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}

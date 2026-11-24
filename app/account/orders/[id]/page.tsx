"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import {
  cancelOrder,
  getOrderById,
  type OrderResponseWire,
} from "@/services/orderService";
import { OrderLoadingState, OrderErrorState } from "@/components/orders/OrderStates";
import OrderStatusChip from "@/components/orders/OrderStatusChip";
import OrderItem from "@/components/orders/OrderItem";
import OrderTimeline from "@/components/orders/OrderTimeline";
import PriceBreakdown from "@/components/orders/PriceBreakdown";
import ConfirmActionDialog from "@/components/admin/ConfirmActionDialog";

function formatDate(value?: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function canCancel(status?: string | null) {
  if (!status) {
    return false;
  }

  return [
    "PENDING",
    "CONFIRMED",
    "PLACED",
    "PROCESSING",
  ].includes(status.toUpperCase());
}

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const { checking, authed } = useRequireAuth("/account/orders");

  const [order, setOrder] = useState<OrderResponseWire | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const idParam = Array.isArray(params?.id)
    ? params.id[0]
    : params?.id;

  const orderId = Number(idParam);
  const invalidOrderId =
    !Number.isInteger(orderId) || orderId <= 0;

  useEffect(() => {
    if (checking || !authed || invalidOrderId) {
      return;
    }

    let cancelled = false;

    const loadOrder = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await getOrderById(orderId);

        if (cancelled) {
          return;
        }

        if ("data" in response && response.data) {
          setOrder(response.data);
        } else if ("message" in response) {
          setError(
            response.message ||
              "Unable to load order details."
          );
        } else {
          setError("Unable to load order details.");
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load order details."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadOrder();

    return () => {
      cancelled = true;
    };
  }, [checking, authed, invalidOrderId, orderId]);

  async function handleCancelOrder() {
    if (!order) {
      return;
    }

    setConfirmOpen(false);
    setCancelling(true);
    setError("");

    try {
      const response = await cancelOrder(order.id);

      if ("data" in response && response.data) {
        setOrder(response.data);
        return;
      }

      if ("message" in response) {
        setError(
          response.message ||
            "Unable to cancel the order."
        );
      } else {
        setError("Unable to cancel the order.");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to cancel the order."
      );
    } finally {
      setCancelling(false);
    }
  }

  if (checking || (loading && !invalidOrderId)) {
    return (
      <Box>
        <Header />

        <Box
          sx={{
            minHeight: "60vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            <OrderLoadingState cards={1} />
          </Box>
        </Box>

        <Footer />
      </Box>
    );
  }

  if ((error || invalidOrderId) && !order) {
    return (
      <Box>
        <Header />

        <Box
          sx={{
            maxWidth: 900,
            mx: "auto",
            px: 2,
            py: 6,
          }}
        >
          <OrderErrorState
            message={invalidOrderId ? "Invalid order ID." : error}
            onRetry={() => {
              setError("");
              void window.location.reload();
            }}
            backLink={{ href: "/account/orders", label: "Back to My Orders" }}
          />
        </Box>

        <Footer />
      </Box>
    );
  }

  if (!order) {
    return (
      <Box>
        <Header />

        <Box
          sx={{
            maxWidth: 900,
            mx: "auto",
            px: 2,
            py: 6,
          }}
        >
          <Alert severity="warning">
            Order details are unavailable.
          </Alert>
        </Box>

        <Footer />
      </Box>
    );
  }

  const items = order.items || [];
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
    <Box>
      <Header />

      <Box
        sx={{
          maxWidth: 1100,
          mx: "auto",
          px: { xs: 2, sm: 3 },
          py: { xs: 3, md: 5 },
        }}
      >
        <Stack spacing={3}>
          <Box>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push("/account/orders")}
              sx={{ mb: 2 }}
              size="small"
            >
              Back to My Orders Back to My Orders
            </Button>

            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                justifyContent: "space-between",
                alignItems: { xs: "flex-start", sm: "center" },
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    overflowWrap: "anywhere",
                    minWidth: 0,
                  }}
                >
                  Order {order.orderNumber || `#${order.id}`}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  Placed {formatDate(order.createdAt)}
                </Typography>
              </Box>

              <OrderStatusChip status={order.status} size="medium" />
            </Box>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}

          {/* Order status timeline */}
          <Card>
            <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, mb: 2 }}
              >
                Order Progress
              </Typography>
              <OrderTimeline status={order.status} />
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, mb: 2 }}
              >
                Ordered Items
              </Typography>

              <Stack spacing={1.5}>
                {items.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No items found for this order.
                  </Typography>
                ) : items.map((item) => (
                  <OrderItem
                    key={item.id}
                    item={{
                      id: item.id,
                      productName: item.productName,
                      sku: item.sku,
                      quantity: item.quantity,
                      unitSellingPrice: item.unitSellingPrice,
                      lineTotal: item.lineTotal,
                      status: order.status,
                    }}
                    showThumbnail
                  />
                ))}
              </Stack>
            </CardContent>
          </Card>

          <Grid container spacing={3} sx={{ alignItems: "stretch" }}>
            <Grid size={{ xs: 12, md: 6 }} sx={{ display: "flex" }}>
              <Card sx={{ width: "100%", height: "100%" }}>
                <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 700, mb: 2 }}
                  >
                    Shipping Address
                  </Typography>

                  {shippingAddress ? (
                    <Stack spacing={1}>
                      {order.shippingFullName && (
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {order.shippingFullName}
                        </Typography>
                      )}
                      {order.shippingPhoneNumber && (
                        <Typography variant="body2" color="text.secondary">
                          {order.shippingPhoneNumber}
                        </Typography>
                      )}
                      {order.shippingStreetAddress && (
                        <Typography variant="body2" color="text.secondary">
                          {order.shippingStreetAddress}
                        </Typography>
                      )}
                      {order.shippingLandmark && (
                        <Typography variant="body2" color="text.secondary">
                          {order.shippingLandmark}
                        </Typography>
                      )}
                      <Typography variant="body2" color="text.secondary">
                        {[
                          order.shippingCity,
                          order.shippingState,
                          order.shippingPostalCode,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </Typography>
                      {order.shippingCountry && (
                        <Typography variant="body2" color="text.secondary">
                          {order.shippingCountry}
                        </Typography>
                      )}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Shipping address not available.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }} sx={{ display: "flex" }}>
              <Card sx={{ width: "100%", height: "100%" }}>
                <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 700, mb: 2 }}
                  >
                    Payment & Summary
                  </Typography>

                  <Stack spacing={1.5}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Typography>Payment Method</Typography>
                      <Typography sx={{ fontWeight: 600 }}>
                        {order.paymentMethod === "COD"
                          ? "Cash on Delivery"
                          : order.paymentMethod === "ONLINE"
                            ? "Online Payment"
                            : "Not available"}
                      </Typography>
                    </Box>

                    {order.paymentStatus && (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography>Payment Status</Typography>
                        <OrderStatusChip
                          status={order.paymentStatus}
                          size="small"
                        />
                      </Box>
                    )}

                    <PriceBreakdown
                      subtotal={order.subtotal}
                      discountAmount={order.discountAmount}
                      shippingCharge={order.shippingCharge}
                      taxAmount={order.taxAmount}
                      totalAmount={order.totalAmount}
                      currency={order.currency}
                    />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {canCancel(order.status) && (
            <Card>
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Stack spacing={2}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <Chip
                      size="small"
                      color="error"
                      label="Cancellation"
                    />
                    <Typography variant="body2" color="text.secondary">
                      You can cancel this order while it is still being processed.
                    </Typography>
                  </Box>

                  <Button
                    variant="outlined"
                    color="error"
                    disabled={cancelling}
                    onClick={() => setConfirmOpen(true)}
                    sx={{ minHeight: 44 }}
                  >
                    {cancelling ? "Cancelling..." : "Cancel Order"}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          )}
        </Stack>

        <ConfirmActionDialog
          id="cancel-order-dialog"
          open={confirmOpen}
          title="Cancel this order?"
          description={
            "Cancelling order " +
            (order.orderNumber || `#${order.id}`) +
            " cannot be undone."
          }
          confirmLabel="Cancel Order"
          cancelLabel="Keep Order"
          confirming={cancelling}
          tone="danger"
          onConfirm={handleCancelOrder}
          onClose={() => setConfirmOpen(false)}
        />

        <Footer />
      </Box>
    </Box>
  );
}

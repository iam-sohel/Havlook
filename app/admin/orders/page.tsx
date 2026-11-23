"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useRouter } from "next/navigation";

import AdminTableSkeletonRows from "@/components/admin/AdminTableSkeletonRows";
import PageHeader from "@/components/ops/PageHeader";

import {
  listAdminOrders,
  updateAdminOrderStatus,
  type AdminOrder,
} from "@/services/adminOrderService";
import OrderStatusChip from "@/components/orders/OrderStatusChip";
import { OrderEmptyState, OrderLoadingState } from "@/components/orders/OrderStates";

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

function formatCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency || "INR"} ${amount.toFixed(2)}`;
  }
}

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

function getStatusColor(status: string) {
  switch (status.toUpperCase()) {
    case "DELIVERED":
      return "success";
    case "CANCELLED":
    case "REFUNDED":
      return "error";
    case "SHIPPED":
      return "info";
    case "PROCESSING":
    case "CONFIRMED":
      return "primary";
    case "PENDING":
      return "warning";
    case "RETURNED":
      return "secondary";
    default:
      return "default";
  }
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

export default function AdminOrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const [totalElements, setTotalElements] = useState(0);

  const loadOrders = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError("");

      const result = await listAdminOrders(
        page,
        rowsPerPage,
        statusFilter || undefined,
        signal,
      );
      if (signal?.aborted) return;

      setOrders(result.content);
      setTotalElements(result.totalElements);
    } catch (err) {
      if (signal?.aborted) return;
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load orders. Please try again.",
      );
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, [page, rowsPerPage, statusFilter]);

  useEffect(() => {
    const controller = new AbortController();

    void Promise.resolve().then(() => {
      if (!controller.signal.aborted) {
        void loadOrders(controller.signal);
      }
    });

    return () => {
      controller.abort();
    };
  }, [loadOrders]);

  const handleStatusFilterChange = (event: SelectChangeEvent) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const handleStatusUpdate = async (order: AdminOrder, status: string) => {
    if (!status || status === order.status) {
      return;
    }

    try {
      setActionLoading(order.id);
      setError("");

      const updatedOrder = await updateAdminOrderStatus(order.id, status);

      setOrders((currentOrders) =>
        currentOrders.map((currentOrder) =>
          currentOrder.id === order.id ? updatedOrder : currentOrder,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update order status.",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return orders;
    }

    return orders.filter((order) => {
      return (
        order.orderNumber.toLowerCase().includes(query) ||
        order.shippingFullName.toLowerCase().includes(query) ||
        order.shippingPhoneNumber.toLowerCase().includes(query) ||
        order.shippingCity.toLowerCase().includes(query)
      );
    });
  }, [orders, search]);

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, py: 4 }}>
      <PageHeader
        title="Orders"
        subtitle="Manage customer orders, payment status, and order fulfillment."
        subtitleVariant="body2"
        rowBreakpoint="md"
        actions={
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => void loadOrders()}
            disabled={loading}
            sx={{ minHeight: 44, flexShrink: 0 }}
          >
            Refresh
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box
            sx={{
              p: 2,
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 2,
            }}
          >
            <TextField
              fullWidth
              size="small"
              label="Search orders"
              placeholder="Order number, customer, phone, city..."
              helperText="Searches the currently loaded page only"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              sx={{
                minHeight: 44,
                "& .MuiOutlinedInput-root": { minHeight: 44 },
              }}
            />

            <FormControl
              size="small"
              sx={{
                minWidth: { xs: "100%", md: 220 },
                "& .MuiOutlinedInput-root": { minHeight: 44 },
              }}
            >
              <InputLabel>Order Status</InputLabel>

              <Select
                value={statusFilter}
                label="Order Status"
                onChange={handleStatusFilterChange}
              >
                <MenuItem value="">All Statuses</MenuItem>

                {ORDER_STATUSES.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {loading ? (
        <OrderLoadingState cards={5} />
      ) : filteredOrders.length === 0 ? (
        <OrderEmptyState
          title={
            orders.length === 0 ? "No orders found" : "No matching orders"
          }
          description={
            orders.length === 0
              ? "No orders are currently available."
              : "Search covers the currently loaded page only. Try a different search or status filter."
          }
          action={
            orders.length === 0 ? null : (
              <Button variant="outlined" onClick={() => setSearch("")}>
                Clear Search
              </Button>
            )
          }
        />
      ) : (
        <Paper
          elevation={0}
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          {/* Mobile: cards (xs, sm) */}
          <Box component="section" sx={{ display: { xs: "block", md: "none" } }}>
            <Stack spacing={2}>
              {filteredOrders.map((order) => {
                return (
                  <Card key={order.id} sx={{ borderRadius: 2, overflow: "hidden" }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: 1,
                          mb: 1.5,
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
                            {order.orderNumber || `#${order.id}`}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {order.id}
                          </Typography>
                        </Box>
                        <OrderStatusChip status={order.status} />
                      </Box>

                      <Divider sx={{ my: 1.5 }} />

                      <Stack spacing={1}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 2,
                          }}
                        >
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, mb: 0.25 }}>
                              Customer
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, overflowWrap: "anywhere" }}>
                              {order.shippingFullName || "—"}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {order.shippingPhoneNumber || "—"}
                            </Typography>
                          </Box>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, mb: 0.25 }}>
                              Date
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, overflowWrap: "anywhere" }}>
                              {formatDate(order.createdAt)}
                            </Typography>
                          </Box>
                        </Box>

                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 2,
                            mt: 1,
                          }}
                        >
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, mb: 0.25 }}>
                              Items
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {order.items.length} {order.items.length === 1 ? "item" : "items"}
                            </Typography>
                          </Box>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, mb: 0.25 }}>
                              Total
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, overflowWrap: "anywhere" }}>
                              {formatCurrency(order.totalAmount, order.currency)}
                            </Typography>
                          </Box>
                        </Box>
                      </Stack>

                      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<VisibilityIcon />}
                          onClick={() => router.push(`/admin/orders/${order.id}`)}
                          sx={{ minHeight: 44 }}
                        >
                          View
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Stack>

            <Stack
              direction="row"
              spacing={1.5}
              sx={{
                justifyContent: "space-between",
                alignItems: "center",
                mt: 2,
                flexWrap: "wrap",
              }}
            >
              <Typography variant="body2" color="text.secondary" role="status">
                Page {page + 1} of {Math.max(Math.ceil(totalElements / rowsPerPage), 1)} · {totalElements} order{totalElements === 1 ? "" : "s"}
              </Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="outlined"
                  disabled={page <= 0}
                  onClick={() => setPage((current) => Math.max(0, current - 1))}
                  sx={{ minHeight: 44 }}
                >
                  Previous
                </Button>
                <Button
                  variant="outlined"
                  disabled={(page + 1) * rowsPerPage >= totalElements}
                  onClick={() => setPage((current) => current + 1)}
                  sx={{ minHeight: 44 }}
                >
                  Next
                </Button>
              </Box>
            </Stack>
          </Box>

          {/* Desktop: table (md+) */}
          <Box component="section" sx={{ display: { xs: "none", sm: "none", md: "block" } }}>
            <TableContainer sx={{ overflowX: "auto" }}>
              <Table sx={{ minWidth: 1000 }} aria-label="Customer orders">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Order</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Items</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Payment</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <AdminTableSkeletonRows columns={8} />
                  ) : (
                    filteredOrders.map((order) => {
                      const isUpdating = actionLoading === order.id;

                      return (
                        <TableRow key={order.id} hover>
                          <TableCell>
                            <Typography sx={{ fontWeight: 700, overflowWrap: "anywhere", minWidth: 0 }}>
                              {order.orderNumber || `#${order.id}`}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {order.id}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontWeight: 600, overflowWrap: "anywhere", minWidth: 0 }}>
                              {order.shippingFullName || "—"}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
                              {order.shippingPhoneNumber || "—"}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", overflowWrap: "anywhere" }}>
                              {order.shippingCity || "—"}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {formatDate(order.createdAt)}
                          </TableCell>
                          <TableCell>
                            <Chip size="small" label={`${order.items.length} ${order.items.length === 1 ? "item" : "items"}`} />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {order.paymentMethod || "—"}
                            </Typography>
                            <Chip size="small" label={order.paymentStatus || "UNKNOWN"} color={getPaymentColor(order.paymentStatus)} sx={{ mt: 0.5 }} />
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontWeight: 700 }}>
                              {formatCurrency(order.totalAmount, order.currency)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {isUpdating ? (
                              <Typography variant="body2" color="text.secondary" role="status">Updating…</Typography>
                            ) : (
                              <FormControl size="small" sx={{ minWidth: 150, "& .MuiOutlinedInput-root": { minHeight: 44 } }}>
                                <Select
                                  value={order.status}
                                  disabled={isUpdating}
                                  inputProps={{ "aria-label": `Update status for order ${order.orderNumber || `#${order.id}`}` }}
                                  onChange={(event) => handleStatusUpdate(order, event.target.value)}
                                  renderValue={(selected) => (
                                    <Chip size="small" label={String(selected)} color={getStatusColor(String(selected))} />
                                  )}
                                >
                                  {ORDER_STATUSES.map((status) => (
                                    <MenuItem key={status} value={status}>{status}</MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Button size="small" variant="outlined" startIcon={<VisibilityIcon />} aria-label={`View order ${order.orderNumber || `#${order.id}`}`} onClick={() => router.push(`/admin/orders/${order.id}`)} sx={{ minHeight: 44 }}>
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={totalElements}
              page={page}
              onPageChange={(_: unknown, nextPage: number) => setPage(nextPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setRowsPerPage(Number(event.target.value));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 20, 50]}
              sx={{
                "& .MuiTablePagination-toolbar": { flexWrap: "wrap", rowGap: 1 },
                "& .MuiTablePagination-actions .MuiIconButton-root": { width: 44, height: 44 },
              }}
            />
          </Box>
        </Paper>
      )}
    </Box>
  );
}

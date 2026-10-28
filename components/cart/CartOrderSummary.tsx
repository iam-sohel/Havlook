"use client";

import Link from "next/link";
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";

interface CartOrderSummaryProps {
  productPrice?: number;
  totalDiscount?: number;
  orderTotal?: number;
  deliveryCharge?: number;
  itemCount?: number;
  checkoutDisabled?: boolean;
  checkoutDisabledReason?: string;
  updating?: boolean;
}

function toSafeNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function formatMoney(amount: number): string {
  return amount.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
}

export default function CartOrderSummary({
  productPrice = 0,
  totalDiscount = 0,
  orderTotal = 0,
  deliveryCharge = 0,
  itemCount = 0,
  checkoutDisabled,
  checkoutDisabledReason,
  updating,
}: CartOrderSummaryProps) {
  const safeProductPrice = toSafeNumber(productPrice);
  const safeTotalDiscount = toSafeNumber(totalDiscount);
  const safeOrderTotal = toSafeNumber(orderTotal);
 
  const safeDeliveryCharge = toSafeNumber(deliveryCharge);

  const safeItemCount = toSafeNumber(itemCount);

  const showDiscount = safeTotalDiscount > 0;
  const totalPayable = safeOrderTotal;

  return (
    <Box
      sx={{
        p: { xs: 2.5, md: 3 },
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: { xs: 2, md: 3 },
        position: "sticky",
        top: 90,
      }}
    >
      <Typography sx={{ fontWeight: 700, fontSize: "1.0625rem" }}>
        Order Summary
      </Typography>

      <Divider sx={{ my: 2.5 }} />

      <Typography
        variant="overline"
        sx={{
          display: "block",
          color: "text.secondary",
          fontWeight: 700,
          letterSpacing: "0.08em",
          mb: 1.5,
        }}
      >
        Price Details ({safeItemCount}{" "}
        {safeItemCount === 1 ? "item" : "items"})
      </Typography>

      <Stack spacing={1.5}>
        {showDiscount && (
          <Stack direction="row" sx={{ justifyContent: "space-between" }}>
            <Typography color="text.secondary">
              Price ({safeItemCount}{" "}
              {safeItemCount === 1 ? "item" : "items"})
            </Typography>

            <Typography sx={{ fontVariantNumeric: "tabular-nums" }}>
              ₹{formatMoney(safeProductPrice)}
            </Typography>
          </Stack>
        )}

        <Stack direction="row" sx={{ justifyContent: "space-between" }}>
          <Typography color="text.secondary">Subtotal</Typography>

          <Typography
            sx={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}
          >
            ₹{formatMoney(safeOrderTotal)}
          </Typography>
        </Stack>

        {showDiscount && (
          <Stack direction="row" sx={{ justifyContent: "space-between" }}>
            <Typography color="text.secondary">Discount</Typography>

            <Typography
              sx={{
                color: "success.main",
                fontWeight: 600,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              − ₹{formatMoney(safeTotalDiscount)}
            </Typography>
          </Stack>
        )}

        <Stack direction="row" sx={{ justifyContent: "space-between" }}>
          <Typography color="text.secondary">Shipping</Typography>

          <Typography
            sx={{
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
              color:
                safeDeliveryCharge === 0
                  ? "success.main"
                  : "text.primary",
            }}
          >
            {safeDeliveryCharge === 0
              ? "Free"
              : `₹${formatMoney(safeDeliveryCharge)}`}
          </Typography>
        </Stack>
      </Stack>

      <Divider sx={{ my: 2.5 }} />

      <Stack
        direction="row"
        sx={{ justifyContent: "space-between", alignItems: "baseline" }}
      >
        <Typography sx={{ fontWeight: 700, fontSize: "1.0625rem" }}>
          Total Payable
        </Typography>

        <Typography
          sx={{
            fontWeight: 700,
            fontSize: { xs: "1.375rem", md: "1.5rem" },
            fontVariantNumeric: "tabular-nums",
          }}
        >
          ₹{formatMoney(totalPayable)}
        </Typography>
      </Stack>

      {showDiscount && safeProductPrice > 0 && (
        <Typography
          variant="body2"
          sx={{ mt: 1, color: "success.main", fontWeight: 600 }}
        >
          You will save ₹{formatMoney(safeTotalDiscount)} on this order
        </Typography>
      )}

      <Button
        component={Link}
        href="/checkout"
        fullWidth
        variant="contained"
        size="large"
        disabled={checkoutDisabled || updating}
        startIcon={
          updating ? (
            <CircularProgress size={16} color="inherit" />
          ) : undefined
        }
        sx={{
          mt: 3,
          py: 1.5,
          borderRadius: 2,
          fontWeight: 700,
          minHeight: 48,
        }}
      >
        {updating ? "Updating cart…" : "Proceed to Checkout"}
      </Button>

      {checkoutDisabled && checkoutDisabledReason && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 1, display: "block", textAlign: "center" }}
        >
          {checkoutDisabledReason}
        </Typography>
      )}

      <Button
        component={Link}
        href="/products"
        fullWidth
        variant="outlined"
        sx={{ mt: 1.5, borderRadius: 2 }}
      >
        Continue Shopping
      </Button>

      <Stack
        direction="row"
        spacing={2}
        sx={{
          mt: 3,
          pt: 2.5,
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <LocalShippingOutlinedIcon
          sx={{ fontSize: 20, color: "text.secondary" }}
        />

        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Delivery charge
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Calculated at checkout
          </Typography>
        </Box>

        <ShieldOutlinedIcon
          sx={{ fontSize: 20, color: "text.secondary", ml: "auto" }}
        />

        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Safe payments
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Secure checkout
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}
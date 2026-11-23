"use client";

import { Box, Divider, Stack, Typography } from "@mui/material";

import { formatPrice } from "@/utils/formatPrice";

interface PriceBreakdownProps {
  subtotal?: number | string | null;
  discountAmount?: number | string | null;
  shippingCharge?: number | string | null;
  taxAmount?: number | string | null;
  totalAmount?: number | string | null;
  currency?: string | null;
  compact?: boolean;
}

function hasAmount(value?: number | string | null): boolean {
  return value !== null && value !== undefined && value !== "";
}

function numericAmount(value?: number | string | null): number {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

function money(value?: number | string | null, currency?: string | null): string {
  const amount = numericAmount(value);
  const currencyCode = currency?.trim().toUpperCase() || "INR";

  if (currencyCode === "INR") {
    return formatPrice(amount);
  }

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
}

export default function PriceBreakdown({
  subtotal,
  discountAmount,
  shippingCharge,
  taxAmount,
  totalAmount,
  currency,
  compact = false,
}: PriceBreakdownProps) {
  const labelVariant = compact ? "body2" : "subtitle2";

  return (
    <Stack spacing={compact ? 1 : 1.5}>
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
        <Typography variant={labelVariant} color="text.secondary">
          Subtotal
        </Typography>
        <Typography variant="body2">{money(subtotal, currency)}</Typography>
      </Box>

      {hasAmount(discountAmount) && numericAmount(discountAmount) > 0 && (
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
          <Typography variant={labelVariant} color="text.secondary">
            Discount
          </Typography>
          <Typography variant="body2" sx={{ color: "success.main", fontWeight: 600 }}>
            - {money(discountAmount, currency)}
          </Typography>
        </Box>
      )}

      {hasAmount(shippingCharge) && (
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
          <Typography variant={labelVariant} color="text.secondary">
            Shipping
          </Typography>
          <Typography
            variant="body2"
            sx={numericAmount(shippingCharge) === 0 ? { color: "success.main", fontWeight: 600 } : undefined}
          >
            {numericAmount(shippingCharge) === 0 ? "Free" : money(shippingCharge, currency)}
          </Typography>
        </Box>
      )}

      {hasAmount(taxAmount) && (
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
          <Typography variant={labelVariant} color="text.secondary">
            Tax
          </Typography>
          <Typography variant="body2">{money(taxAmount, currency)}</Typography>
        </Box>
      )}

      <Divider sx={{ my: compact ? 1 : 1.5 }} />

      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Total
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {money(totalAmount, currency)}
        </Typography>
      </Box>
    </Stack>
  );
}

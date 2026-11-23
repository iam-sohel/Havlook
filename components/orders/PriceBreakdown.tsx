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

function money(value?: number | string | null): string {
  return formatPrice(Number(value ?? 0));
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
  return (
    <Stack spacing={compact ? 1 : 1.5}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Typography variant={compact ? "body2" : "subtitle2"} color="text.secondary">
          Subtotal
        </Typography>
        <Typography variant="body2">{money(subtotal)}</Typography>
      </Box>

      {discountAmount && Number(discountAmount) > 0 && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Typography variant={compact ? "body2" : "subtitle2"} color="text.secondary">
            Discount
          </Typography>
          <Typography variant="body2" sx={{ color: "success.main", fontWeight: 600 }}>
            - {money(discountAmount)}
          </Typography>
        </Box>
      )}

      {shippingCharge && Number(shippingCharge) > 0 && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Typography variant={compact ? "body2" : "subtitle2"} color="text.secondary">
            Shipping
          </Typography>
          <Typography variant="body2">{money(shippingCharge)}</Typography>
        </Box>
      )}

      {taxAmount && Number(taxAmount) > 0 && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Typography variant={compact ? "body2" : "subtitle2"} color="text.secondary">
            Tax
          </Typography>
          <Typography variant="body2">{money(taxAmount)}</Typography>
        </Box>
      )}

      <Divider sx={{ my: compact ? 1 : 1.5 }} />

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Typography
          variant="h6"
          sx={{ fontWeight: 700 }}
        >
          Total
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {money(totalAmount)}
        </Typography>
      </Box>

      {currency && (
        <Typography variant="caption" color="text.secondary">
          {currency}
        </Typography>
      )}
    </Stack>
  );
}

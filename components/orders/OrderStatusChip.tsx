"use client";

import { Chip } from "@mui/material";

/**
 * HAVLOOK — Unified order status chip.
 *
 * Used across customer, seller and admin order pages so every order status
 * carries the same visual tone everywhere. Maps only real backend status
 * values; unknown values fall back to a neutral chip. No invented states.
 */

export type OrderStatusTone = "success" | "warning" | "error" | "info" | "primary" | "neutral";

const TONE_STYLE: Record<OrderStatusTone, { bgcolor: string; color: string }> = {
  success: { bgcolor: "success.light", color: "success.main" },
  warning: { bgcolor: "warning.light", color: "warning.main" },
  error: { bgcolor: "error.light", color: "error.main" },
  info: { bgcolor: "info.light", color: "info.main" },
  primary: { bgcolor: "rgba(241, 90, 41, 0.10)", color: "primary.dark" },
  neutral: { bgcolor: "grey.200", color: "text.secondary" },
};

export function toneForOrderStatus(status?: string | null): OrderStatusTone {
  switch ((status ?? "").toUpperCase()) {
    case "DELIVERED":
    case "COMPLETED":
    case "PAID":
      return "success";

    case "PENDING":
    case "RETURN_REQUESTED":
    case "RETURNED":
      return "warning";

    case "CONFIRMED":
    case "SHIPPED":
    case "OUT_FOR_DELIVERY":
    case "RETURN_APPROVED":
      return "info";

    case "PROCESSING":
    case "PLACED":
      return "primary";

    case "CANCELLED":
    case "CANCELED":
    case "FAILED":
    case "REFUNDED":
      return "error";

    default:
      return "neutral";
  }
}

export function humanizeOrderStatus(status?: string | null): string {
  if (!status) return "—";
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

interface OrderStatusChipProps {
  status?: string | null;
  label?: string;
  tone?: OrderStatusTone;
  size?: "small" | "medium";
}

export default function OrderStatusChip({
  status,
  label,
  tone,
  size = "small",
}: OrderStatusChipProps) {
  const resolvedTone = tone ?? toneForOrderStatus(status);

  return (
    <Chip
      size={size}
      label={label ?? humanizeOrderStatus(status)}
      sx={{
        ...TONE_STYLE[resolvedTone],
        fontWeight: 700,
        border: "1px solid",
        borderColor: "divider",
      }}
    />
  );
}

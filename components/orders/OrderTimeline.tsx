"use client";

import { Box, Chip, Stack, Typography } from "@mui/material";

import OrderStatusChip from "./OrderStatusChip";

const STEPS: Array<{ key: string; label: string }> = [
  { key: "PLACED", label: "Order Placed" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "PROCESSING", label: "Processing" },
  { key: "SHIPPED", label: "Shipped" },
  { key: "DELIVERED", label: "Delivered" },
];

function stepIndex(status?: string | null): number {
  const normalized = String(status || "").toUpperCase();

  if (normalized === "DELIVERED") return 4;
  if (normalized === "SHIPPED" || normalized === "OUT_FOR_DELIVERY") return 3;
  if (normalized === "PROCESSING") return 2;
  if (normalized === "CONFIRMED") return 1;
  if (normalized === "PENDING" || normalized === "PLACED") return 0;

  return -1;
}

interface OrderTimelineProps {
  status?: string | null;
  compact?: boolean;
}

export default function OrderTimeline({ status, compact = false }: OrderTimelineProps) {
  const current = stepIndex(status);
  const cancelled =
    status &&
    ["CANCELLED", "CANCELED", "FAILED"].includes(String(status).toUpperCase());

  return (
    <Stack spacing={compact ? 1 : 2}>
      {cancelled ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            py: compact ? 1 : 2,
          }}
        >
          <Chip size="small" label="Cancelled" color="error" />
          <Typography variant="body2" color="text.secondary">
            This order was cancelled.
          </Typography>
        </Box>
      ) : (
        <>
          <Stack
            direction="row"
            spacing={1}
            sx={{
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {STEPS.map((step, index) => {
              const isDone = current > index;
              const isActive = current === index;
              const isPending = current < index;

              return (
                <Box
                  key={step.key}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    minWidth: 0,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      flexShrink: 0,
                      border: `1px solid`,
                      borderColor: "divider",
                      bgcolor: isDone
                        ? "success.main"
                        : isActive
                          ? "primary.main"
                          : "grey.100",
                    }}
                  >
                    {isDone ? (
                      <Typography
                        component="span"
                        variant="caption"
                        sx={{ color: "#FFFFFF", fontWeight: 700, px: 0.5 }}
                      >
                        ✓
                      </Typography>
                    ) : (
                      <Typography
                        component="span"
                        variant="caption"
                        sx={{
                          color: isActive ? "#FFFFFF" : "text.secondary",
                          fontWeight: 700,
                          px: 0.5,
                        }}
                      >
                        {index + 1}
                      </Typography>
                    )}
                  </Box>

                  <Typography
                    variant={compact ? "caption" : "body2"}
                    sx={{
                      fontWeight: isActive ? 700 : 500,
                      color: isActive
                        ? "primary.main"
                        : isDone
                          ? "success.main"
                          : "text.secondary",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {step.label}
                  </Typography>

                  {index < STEPS.length - 1 && (
                    <Box
                      sx={{
                        height: 1,
                        flexGrow: 1,
                        bgColor: isDone ? "success.main" : "divider",
                      }}
                    />
                  )}
                </Box>
              );
            })}
          </Stack>

          <Box
            sx={{
              mt: compact ? 1 : 2,
              display: "flex",
              alignItems: "baseline",
              gap: 1,
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Order Status
            </Typography>
            <OrderStatusChip status={status} size="small" />
          </Box>
        </>
      )}
    </Stack>
  );
}

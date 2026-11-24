"use client";

import { Box, Chip, Stack, Typography } from "@mui/material";

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

export default function OrderTimeline({
  status,
  compact = false,
}: OrderTimelineProps) {
  const current = stepIndex(status);

  const cancelled =
    status &&
    ["CANCELLED", "CANCELED", "FAILED"].includes(
      String(status).toUpperCase(),
    );

  return (
    <Stack spacing={compact ? 1 : 2} sx={{ width: "100%" }}>
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
        <Box
          sx={{
            display: { xs: "flex", sm: "grid" },
            flexDirection: { xs: "column", sm: "initial" },
            gridTemplateColumns: {
              sm: `repeat(${STEPS.length}, minmax(0, 1fr))`,
            },
            alignItems: "stretch",
            width: "100%",
          }}
        >
          {STEPS.map((step, index) => {
            const isDone = current > index;
            const isActive = current === index;

            const connectorColor = current > index ? "success.main" : "divider";

            return (
              <Box
                key={step.key}
                sx={{
                  position: "relative",
                  display: "flex",
                  flex: { xs: "none", sm: 1 },
                  flexDirection: {
                    xs: "row",
                    sm: "column",
                  },
                  alignItems: "center",
                  justifyContent: {
                    xs: "flex-start",
                    sm: "flex-start",
                  },
                  gap: { xs: 1.5, sm: 1 },
                  minWidth: 0,
                  minHeight: { xs: 52, sm: 60 },
                  "&:not(:last-child)::after": {
                    content: '""',
                    position: "absolute",
                    zIndex: 0,
                    bgcolor: connectorColor,
                    display: "block",
                    left: {
                      xs: 12,
                      sm: "calc(50% + 13px)",
                    },
                    right: {
                      xs: "auto",
                      sm: "calc(-50% + 13px)",
                    },
                    top: {
                      xs: 26,
                      sm: 12,
                    },
                    bottom: {
                      xs: -26,
                      sm: "auto",
                    },
                    width: {
                      xs: "2px",
                      sm: "auto",
                    },
                    height: {
                      xs: "auto",
                      sm: "2px",
                    },
                  },
                }}
              >
                <Box
                  sx={{
                    position: "relative",
                    zIndex: 1,
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid",
                    borderColor: isDone
                      ? "success.main"
                      : isActive
                        ? "primary.main"
                        : "divider",
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
                      sx={{
                        color: "#FFFFFF",
                        fontWeight: 700,
                        lineHeight: 1,
                      }}
                    >
                      {"\u2713"}
                    </Typography>
                  ) : (
                    <Typography
                      component="span"
                      variant="caption"
                      sx={{
                        color: isActive ? "#FFFFFF" : "text.secondary",
                        fontWeight: 700,
                        lineHeight: 1,
                      }}
                    >
                      {index + 1}
                    </Typography>
                  )}
                </Box>

                <Typography
                  variant={compact ? "caption" : "body2"}
                  sx={{
                    position: "relative",
                    zIndex: 1,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive
                      ? "primary.main"
                      : isDone
                        ? "success.main"
                        : "text.secondary",
                    textAlign: {
                      xs: "left",
                      sm: "center",
                    },
                    minWidth: 0,
                    whiteSpace: {
                      xs: "normal",
                      sm: "nowrap",
                    },
                    overflowWrap: "break-word",
                  }}
                >
                  {step.label}
                </Typography>
              </Box>
            );
          })}
        </Box>
      )}
    </Stack>
  );
}

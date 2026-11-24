"use client";

import { Box, Stack, Typography } from "@mui/material";

import {
  PRODUCT_PLACEHOLDER,
  resolveProductImage,
} from "@/utils/productImages";
import { formatPrice } from "@/utils/formatPrice";
import OrderStatusChip from "./OrderStatusChip";

interface OrderItemProps {
  item: {
    id?: number | null;
    productName?: string | null;
    sku?: string | null;
    quantity?: number | null;
    unitSellingPrice?: number | string | null;
    lineTotal?: number | string | null;
    productVariantId?: number | null;
    discountAmount?: number | string | null;
    status?: string | null;
    image?: string | null;
  };
  showThumbnail?: boolean;
  showStatus?: boolean;
}

function money(value?: number | string | null): string {
  return formatPrice(Number(value ?? 0));
}

export default function OrderItem({
  item,
  showThumbnail = false,
  showStatus = false,
}: OrderItemProps) {
  const imageSrc = resolveProductImage(item?.image);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: 2,
        minWidth: 0,
      }}
    >
      {showThumbnail && (
        <Box
          sx={{
            width: 56,
            height: 56,
            flexShrink: 0,
            borderRadius: 2,
            bgcolor: "grey.100",
            overflow: "hidden",
            border: "1px solid",
            borderColor: "divider",
            position: "relative",
          }}
        >
          <img
            src={imageSrc}
            alt={item.productName || "Product"}
            onError={(event) => {
              const image = event.currentTarget;
              image.onerror = null;
              image.src = PRODUCT_PLACEHOLDER;
            }}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        </Box>
      )}

      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Stack spacing={0.25}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              minWidth: 0,
              whiteSpace: "normal",
              overflowWrap: "anywhere",
              wordBreak: "normal",
            }}
          >
            {item.productName
              ? item.productName.replace(/\s*\|\s*/g, " | ").trim()
              : "Product"}
          </Typography>

          {item.sku && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ overflowWrap: "anywhere", minWidth: 0 }}
            >
              SKU: {item.sku}
            </Typography>
          )}

          <Typography variant="caption" color="text.secondary">
            Qty {item.quantity ?? "-"}
          </Typography>
        </Stack>
      </Box>

      {showStatus && item.status && (
        <Box sx={{ flexShrink: 0 }}>
          <OrderStatusChip status={item.status} />
        </Box>
      )}

      <Box sx={{ flexShrink: 0, minWidth: 0, ml: "auto", textAlign: "right", alignSelf: "flex-start" }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 700,
            whiteSpace: "nowrap",
            overflowWrap: "anywhere",
            minWidth: 0,
          }}
        >
          {money(item.lineTotal)}
        </Typography>
      </Box>
    </Box>
  );
}

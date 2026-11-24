"use client";

import type { ReactNode } from "react";

import {
  Button,
  Card,
  CardContent,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";

import Link from "next/link";

/**
 * HAVLOOK — Shared order feedback states.
 *
 * Consistent loading, empty and error treatments for all order pages
 * (customer, seller, admin). Never invent business data; missing data is
 * shown as missing, and zero remains a valid backend value.
 */

export function OrderEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: { xs: 2.5, sm: 4 }, textAlign: "center" }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
          {title}
        </Typography>

        {description ? (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {description}
          </Typography>
        ) : null}

        {action ? (
          <Stack direction="row" spacing={1.5} sx={{ justifyContent: "center" }}>
            {action}
          </Stack>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function OrderLoadingState({ cards = 3 }: { cards?: number }) {
  return (
    <Stack spacing={3} role="status" aria-live="polite" aria-busy="true">
      <Skeleton variant="text" width={260} height={40} />
      <Skeleton variant="text" width={360} height={20} sx={{ mt: 1 }} />

      {Array.from({ length: cards }).map((_, index) => (
        <Skeleton
          key={index}
          variant="rounded"
          height={200}
          sx={{ borderRadius: 3 }}
        />
      ))}
    </Stack>
  );
}

export function OrderErrorState({
  message,
  onRetry,
  backLink,
}: {
  message: string;
  onRetry?: () => void;
  backLink?: { href: string; label: string };
}) {
  return (
    <Card sx={{ borderRadius: 3, borderColor: "error.main" }}>
      <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
          Something went wrong
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {message}
        </Typography>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{ alignItems: { xs: "stretch", sm: "center" } }}
        >
          {onRetry ? (
            <Button variant="outlined" onClick={onRetry} sx={{ minHeight: 44 }}>
              Try again
            </Button>
          ) : null}

          {backLink ? (
            <Button
              component={Link}
              href={backLink.href}
              variant="text"
              sx={{ minHeight: 44 }}
            >
              {backLink.label}
            </Button>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}

"use client";

import { Box, Typography } from "@mui/material";

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        mt: 6,
        bgcolor: "secondary.dark",
        color: "#F4EFE6",
        py: 4,
        textAlign: "center",
        borderTop: "1px solid",
        borderColor: "divider",
      }}
    >
      <Typography
        variant="body2"
        sx={{
          color: "#F4EFE6",
          fontWeight: 500,
        }}
      >
        {"© 2026 HavLook. All Rights Reserved."}
      </Typography>
    </Box>
  );
}

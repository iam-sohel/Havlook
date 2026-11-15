"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

import {
  BottomNavigation,
  BottomNavigationAction,
  Badge,
} from "@mui/material";

import HomeIcon from "@mui/icons-material/Home";
import CategoryIcon from "@mui/icons-material/Category";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import PersonOutlineIcon from "@mui/icons-material/Person";

import useCartStore from "@/store/cartStore";
import useWishlistStore from "@/store/wishlistStore";
import useAuthStore from "@/store/authStore";

interface BottomNavProps {
  className?: string;
}

const NAV_ITEMS = [
  { label: "Home", path: "/", icon: <HomeIcon /> },
  { label: "Categories", path: "/products", icon: <CategoryIcon /> },
  { label: "Wishlist", path: "/wishlist", icon: <FavoriteBorderIcon /> },
  { label: "Cart", path: "/cart", icon: <ShoppingCartIcon /> },
  {
    label: "Account",
    path: "/account",
    icon: <PersonOutlineIcon />,
  },
] as const;

export default function BottomNav({ className }: BottomNavProps) {
  const pathname = usePathname();

  const cartItems = useCartStore((state) => state.items);
  const wishlistItems = useWishlistStore((state) => state.items);
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  const isAuthenticated = hasHydrated && Boolean(user);

  const cartCount = cartItems.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  const wishlistCount = wishlistItems.length;

  const accountPath = isAuthenticated
    ? "/account"
    : "/login";

  let activeIndex = 0;

  if (pathname === "/wishlist") {
    activeIndex = 2;
  } else if (pathname === "/cart") {
    activeIndex = 3;
  } else if (
    pathname === "/account" ||
    pathname.startsWith("/account/") ||
    pathname === "/login" ||
    pathname === "/signup"
  ) {
    activeIndex = 4;
  } else if (pathname === "/" || pathname === "") {
    activeIndex = 0;
  } else if (
    pathname === "/products" ||
    pathname.startsWith("/category/")
  ) {
    activeIndex = 1;
  } else if (pathname.startsWith("/products/")) {
    activeIndex = -1;
  } else if (pathname === "/search") {
    activeIndex = 0;
  } else if (
    pathname === "/checkout" ||
    pathname === "/order-success"
  ) {
    activeIndex = 3;
  }

  return (
    <BottomNavigation
      className={className}
      value={activeIndex}
      showLabels
      sx={{
        display: { xs: "flex", md: "none" },
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1300,
        bgcolor: "background.paper",
        borderTop: "1px solid",
        borderColor: "divider",
        "& .MuiBottomNavigationAction-root": {
          minWidth: 0,
          padding: { xs: 0, sm: 0 },
          "&.Mui-selected": {
            color: "primary.main",
          },
        },
      }}
    >
      {NAV_ITEMS.map((item, index) => {
        const badgeCount =
          item.label === "Cart"
            ? cartCount
            : item.label === "Wishlist"
              ? wishlistCount
              : 0;

        const path =
          item.label === "Account" ? accountPath : item.path;

        const icon =
          badgeCount > 0 ? (
            <Badge badgeContent={badgeCount} color="primary">
              {item.icon}
            </Badge>
          ) : (
            item.icon
          );

        return (
          <BottomNavigationAction
            key={item.label}
            component={Link}
            href={path}
            value={index}
            label={item.label}
            icon={icon}
            sx={{
              minHeight: 56,
              height: 56,
              px: 0.5,
              "&.Mui-selected": {
                fontWeight: 700,
              },
            }}
          />
        );
      })}
    </BottomNavigation>
  );
}

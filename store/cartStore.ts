
"use client";

import { create } from "zustand";
import {
  addItemToCart,
  clearServerCart,
  getCart,
  removeCartItem,
  updateCartItem,
  type CartResponseWire,
} from "@/services/cartService";

export interface CartItem {
  id: number | string;
  productId: number;
  slug: string;
  title: string;
  image: string;
  price: number;
  quantity: number;
  itemTotal: number;
  variantId?: string | number;
  variantLabel?: string;
}

interface CartMeta {
  slug?: string;
  title?: string;
  image?: string;
  variantId?: string | number;
  variantLabel?: string;
}

interface AddToCartInput {
  productId: number | string;
  slug?: string;
  title?: string;
  image?: string;
  price?: number;
  quantity?: number;
  variantId?: string | number;
  variantLabel?: string;
}

interface CartStore {
  items: CartItem[];
  loading: boolean;
  error: string | null;

  /** Backend orderTotal — product subtotal after discounts, excluding delivery. */
  serverGrandTotal: number;

  /** Backend totalItems. */
  serverTotalItems: number;

  /** Backend productPrice — total MRP before discounts. */
  serverProductPrice: number;

  /** Backend totalDiscount — total discount across the cart. */
  serverTotalDiscount: number;

  /** Backend deliveryCharge — calculated from active delivery rules. */
  serverDeliveryCharge: number;

  addToCart: (input: AddToCartInput) => Promise<{
    ok: boolean;
    message?: string;
  }>;

  updateQuantity: (
    rowId: number | string,
    quantity: number,
  ) => Promise<{
    ok: boolean;
    message?: string;
  }>;

  removeFromCart: (
    rowId: number | string,
  ) => Promise<{
    ok: boolean;
    message?: string;
  }>;

  clearCart: () => Promise<void>;
  resetLocal: () => void;
  fetchCart: () => Promise<void>;
  clearError: () => void;

  increaseQuantity: (
    rowId: number | string,
    options?: { variantId?: string | number },
  ) => void;

  decreaseQuantity: (
    rowId: number | string,
    options?: { variantId?: string | number },
  ) => void;

  totalCount: () => number;
}

const META_STORAGE_KEY = "HAVLOOK-cart-meta";

function readMeta(): Record<string, CartMeta> {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(META_STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw);

    if (
      parsed &&
      typeof parsed === "object" &&
      !Array.isArray(parsed)
    ) {
      return parsed;
    }
  } catch {
    // Ignore malformed local metadata.
  }

  return {};
}

function writeMeta(meta: Record<string, CartMeta>) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      META_STORAGE_KEY,
      JSON.stringify(meta),
    );
  } catch {
    // Ignore localStorage failures.
  }
}

function ensureMeta(): Map<string, CartMeta> {
  return new Map(
    Object.entries(readMeta()).map(
      ([key, value]) => [key, value ?? {}],
    ),
  );
}

function saveItemMeta(
  cartItemId: number | string,
  meta: CartMeta,
) {
  const existing = readMeta();

  existing[String(cartItemId)] = {
    ...(existing[String(cartItemId)] ?? {}),
    ...meta,
  };

  writeMeta(existing);
}

function removeItemMeta(cartItemId: number | string) {
  const existing = readMeta();
  delete existing[String(cartItemId)];
  writeMeta(existing);
}

/* Backend → Frontend mapping */

function mapWire(
  wire: CartResponseWire["items"][number],
): CartItem {
  const meta = ensureMeta().get(String(wire.id));

  const backendImage =
    typeof wire.productImage === "string"
      ? wire.productImage.trim()
      : "";

  const metadataImage =
    typeof meta?.image === "string"
      ? meta.image.trim()
      : "";

  return {
    id: wire.id,
    productId: wire.productId,
    slug: meta?.slug ?? "",
    title: wire.productName || meta?.title || "",
    image: backendImage || metadataImage || "",
    price: wire.unitPrice,
    quantity: wire.quantity,
    itemTotal: wire.lineTotal,
    variantId: wire.productVariantId ?? meta?.variantId,
    variantLabel: meta?.variantLabel,
  };
}

/* Apply backend response */

function apply(
  response: CartResponseWire,
  set: (
    partial:
      | Partial<CartStore>
      | ((state: CartStore) => Partial<CartStore>),
  ) => void,
) {
  console.log("Cart API data received by store:", response);
  console.log("Delivery charge received by store:", response.deliveryCharge);
  const items = response.items.map(mapWire);


  const grandTotal = response.orderTotal;
  const totalItems = response.totalItems;

  set({
    items,
    serverGrandTotal: grandTotal,
    serverTotalItems: totalItems,
    serverProductPrice: response.productPrice,
    serverTotalDiscount: response.totalDiscount,
    serverDeliveryCharge: response.deliveryCharge,
    loading: false,
    error: null,
  });

  return { items, grandTotal, totalItems };
}

/* Zustand store */

const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  serverGrandTotal: 0,
  serverTotalItems: 0,
  serverProductPrice: 0,
  serverTotalDiscount: 0,
  serverDeliveryCharge: 0,

  fetchCart: async () => {
    set({ loading: true, error: null });

    try {
      const result = await getCart();

      if (!result.ok) {
        set({
          loading: false,
          error: result.message ?? "Failed to load cart.",
        });
        return;
      }

      apply(result.data, set);
    } catch (error) {
      set({
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load cart.",
      });
    }
  },

  addToCart: async (input) => {
    const quantity = Math.max(1, Number(input.quantity ?? 1));

    const variantId =
      input.variantId !== undefined && input.variantId !== null
        ? Number(input.variantId)
        : undefined;

    if (variantId === undefined || !Number.isFinite(variantId)) {
      const message =
        "Please select a product variant before adding to cart.";

      set({ loading: false, error: message });
      return { ok: false, message };
    }

    set({ loading: true, error: null });

    try {
      const result = await addItemToCart(variantId, quantity);

      if (!result.ok) {
        const message =
          result.message ?? "Failed to add item to cart.";

        set({ loading: false, error: message });
        return { ok: false, message };
      }

      const returnedItem = result.data.items.find(
        (item) =>
          Number(item.productId) === Number(input.productId) &&
          Number(item.productVariantId) === Number(variantId),
      );

      if (returnedItem) {
        saveItemMeta(returnedItem.id, {
          slug: input.slug,
          title: input.title,
          ...(input.image?.trim()
            ? { image: input.image.trim() }
            : {}),
          variantId: returnedItem.productVariantId,
          variantLabel: input.variantLabel,
        });
      }

      apply(result.data, set);
      return { ok: true };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to add item to cart.";

      set({ loading: false, error: message });
      return { ok: false, message };
    }
  },

  updateQuantity: async (rowId, quantity) => {
    const safeQuantity = Math.max(
      1,
      Math.floor(Number(quantity)),
    );

    const numericRowId = Number(rowId);

    if (!Number.isFinite(numericRowId)) {
      const message = "Invalid cart item ID.";
      set({ loading: false, error: message });
      return { ok: false, message };
    }

    set({ loading: true, error: null });

    try {
      const result = await updateCartItem(
        numericRowId,
        safeQuantity,
      );

      if (!result.ok) {
        const message =
          result.message ?? "Failed to update cart item.";

        set({ loading: false, error: message });
        return { ok: false, message };
      }

      apply(result.data, set);
      return { ok: true };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to update cart item.";

      set({ loading: false, error: message });
      return { ok: false, message };
    }
  },

  removeFromCart: async (rowId) => {
    const numericRowId = Number(rowId);

    if (!Number.isFinite(numericRowId)) {
      const message = "Invalid cart item ID.";
      set({ loading: false, error: message });
      return { ok: false, message };
    }

    set({ loading: true, error: null });

    try {
      const result = await removeCartItem(numericRowId);

      if (!result.ok) {
        const message =
          result.message ?? "Failed to remove cart item.";

        set({ loading: false, error: message });
        return { ok: false, message };
      }

      removeItemMeta(numericRowId);
      apply(result.data, set);
      return { ok: true };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to remove cart item.";

      set({ loading: false, error: message });
      return { ok: false, message };
    }
  },

  clearCart: async () => {
    set({ loading: true, error: null });

    try {
      const result = await clearServerCart();

      if (!result.ok) {
        const message =
          result.message ?? "Failed to clear cart.";

        set({ loading: false, error: message });
        throw new Error(message);
      }

      if (typeof window !== "undefined") {
        try {
          window.localStorage.removeItem(META_STORAGE_KEY);
        } catch {
          // Ignore localStorage failures.
        }
      }

      set({
        items: [],
        serverGrandTotal: 0,
        serverTotalItems: 0,
        serverProductPrice: 0,
        serverTotalDiscount: 0,
        serverDeliveryCharge: 0,
        loading: false,
        error: null,
      });
    } catch (error) {
      set({
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to clear cart.",
      });

      throw error;
    }
  },

  resetLocal: () => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(META_STORAGE_KEY);
      } catch {
        // Ignore localStorage failures.
      }
    }

    set({
      items: [],
      serverGrandTotal: 0,
      serverTotalItems: 0,
      serverProductPrice: 0,
      serverTotalDiscount: 0,
      serverDeliveryCharge: 0,
      loading: false,
      error: null,
    });
  },

  clearError: () => {
    set({ error: null });
  },

  increaseQuantity: (rowId) => {
    const line = get().items.find(
      (item) => String(item.id) === String(rowId),
    );

    const next = (line?.quantity ?? 0) + 1;
    void get().updateQuantity(rowId, next);
  },

  decreaseQuantity: (rowId) => {
    const line = get().items.find(
      (item) => String(item.id) === String(rowId),
    );

    const next = Math.max(1, (line?.quantity ?? 0) - 1);
    void get().updateQuantity(rowId, next);
  },

  totalCount: () =>
    get().serverTotalItems ||
    get().items.reduce((sum, item) => sum + item.quantity, 0),
}));

export default useCartStore;

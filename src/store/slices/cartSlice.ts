import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Product } from "@/types";

export interface CartLine {
  productId: string;
  sku: string;
  name: string;
  price: number;
  image?: string;
  size: string;
  color: string;
}

interface CartState {
  lines: CartLine[];
  couponCode: string;
}

const initialState: CartState = { lines: [], couponCode: "" };

type AddToCartPayload = {
  product: Product;
  size: string;
  color?: string;
};

type RemoveFromCartPayload = {
  productId: string;
  size: string;
  color?: string;
};

export function getCartLineKey({
  productId,
  size,
  color,
}: {
  productId: string;
  size: string;
  color?: string;
}) {
  return `${productId}:${size}:${color ?? ""}`;
}

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<AddToCartPayload>) => {
      const { product, size, color = "" } = action.payload;
      const lineKey = getCartLineKey({ productId: product._id, size, color });
      if (state.lines.some((line) => getCartLineKey(line) === lineKey)) return;
      state.lines.push({
        productId: product._id,
        sku: product.sku,
        name: product.name,
        price: product.price,
        image: product.images[0],
        size,
        color,
      });
    },
    removeFromCart: (state, action: PayloadAction<RemoveFromCartPayload>) => {
      const lineKey = getCartLineKey(action.payload);
      state.lines = state.lines.filter((line) => getCartLineKey(line) !== lineKey);
    },
    setCoupon: (state, action: PayloadAction<string>) => {
      state.couponCode = action.payload.trim().toUpperCase();
    },
    clearCoupon: (state) => {
      state.couponCode = "";
    },
    clearCart: (state) => {
      state.lines = [];
      state.couponCode = "";
    },
  },
});

export const { addToCart, removeFromCart, setCoupon, clearCoupon, clearCart } = cartSlice.actions;
export default cartSlice.reducer;

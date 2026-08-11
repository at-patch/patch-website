import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Product } from "@/types";
import type { CartLine } from "./cartSlice";

/**
 * Buy Now runs as an isolated single-item checkout intent that never touches the
 * persisted cart (decision D9). The intent is short-lived so a stale tab cannot
 * resurrect an old selection; the server re-reads price, weight, and availability
 * on order creation regardless, so nothing here is trusted as pricing input.
 */
export const BUY_NOW_TTL_MS = 30 * 60 * 1000;

export type CheckoutMode = "cart" | "buy-now";

export type BuyNowIntent = {
  line: CartLine;
  createdAt: number;
};

interface CheckoutState {
  buyNow: BuyNowIntent | null;
  /** Which flow produced the order currently awaiting payment confirmation. */
  lastSubmittedMode: CheckoutMode | null;
}

const initialState: CheckoutState = { buyNow: null, lastSubmittedMode: null };

type StartBuyNowPayload = {
  product: Product;
  size: string;
  color?: string;
};

export function isBuyNowIntentFresh(intent: BuyNowIntent | null, now: number = Date.now()) {
  if (!intent) return false;
  return now - intent.createdAt < BUY_NOW_TTL_MS;
}

const checkoutSlice = createSlice({
  name: "checkout",
  initialState,
  reducers: {
    startBuyNow: (state, action: PayloadAction<StartBuyNowPayload>) => {
      const { product, size, color = "" } = action.payload;
      state.buyNow = {
        line: {
          productId: product._id,
          sku: product.sku,
          name: product.name,
          price: product.price,
          image: product.images[0],
          size,
          color,
          weightKg: product.weightKg,
        },
        createdAt: Date.now(),
      };
      state.lastSubmittedMode = null;
    },
    clearBuyNow: (state) => {
      state.buyNow = null;
      state.lastSubmittedMode = null;
    },
    markCheckoutSubmitted: (state, action: PayloadAction<CheckoutMode>) => {
      state.lastSubmittedMode = action.payload;
    },
  },
});

export const { startBuyNow, clearBuyNow, markCheckoutSubmitted } = checkoutSlice.actions;
export default checkoutSlice.reducer;

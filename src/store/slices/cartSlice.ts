import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Product } from "@/types";

export interface CartLine {
  productId: string;
  sku: string;
  name: string;
  price: number;
  image?: string;
}

interface CartState {
  lines: CartLine[];
}

const initialState: CartState = { lines: [] };

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<Product>) => {
      const p = action.payload;
      if (state.lines.some((l) => l.productId === p._id)) return;
      state.lines.push({
        productId: p._id,
        sku: p.sku,
        name: p.name,
        price: p.price,
        image: p.images[0],
      });
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.lines = state.lines.filter((l) => l.productId !== action.payload);
    },
    clearCart: (state) => {
      state.lines = [];
    },
  },
});

export const { addToCart, removeFromCart, clearCart } = cartSlice.actions;
export default cartSlice.reducer;

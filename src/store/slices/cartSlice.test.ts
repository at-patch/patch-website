import { describe, expect, it } from "vitest";
import cartReducer, {
  addToCart,
  clearCart,
  clearCoupon,
  getCartLineKey,
  removeFromCart,
  setCoupon,
} from "./cartSlice";
import type { Product } from "@/types";

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    _id: "prod-1",
    sku: "SKU-1",
    name: "Denim Jacket",
    slug: "denim-jacket",
    description: "A jacket",
    story: "",
    images: ["/jacket.jpg"],
    price: 1500,
    currency: "BDT",
    category: "outerwear",
    materials: [],
    rarity: "one-of-one",
    size: "M",
    variants: [],
    batchLabel: "1-of-1",
    status: "available",
    createdAt: "",
    updatedAt: "",
    ...overrides,
  } as Product;
}

describe("cartSlice", () => {
  it("adds a line for a new size/color combination", () => {
    const state = cartReducer(undefined, addToCart({ product: makeProduct(), size: "M" }));
    expect(state.lines).toHaveLength(1);
    expect(state.lines[0]).toMatchObject({ productId: "prod-1", size: "M", color: "", price: 1500 });
  });

  it("does not add a duplicate line for the same product/size/color", () => {
    let state = cartReducer(undefined, addToCart({ product: makeProduct(), size: "M" }));
    state = cartReducer(state, addToCart({ product: makeProduct(), size: "M" }));
    expect(state.lines).toHaveLength(1);
  });

  it("treats different sizes of the same product as separate lines", () => {
    let state = cartReducer(undefined, addToCart({ product: makeProduct(), size: "M" }));
    state = cartReducer(state, addToCart({ product: makeProduct(), size: "L" }));
    expect(state.lines).toHaveLength(2);
  });

  it("removes a line matching product/size/color", () => {
    let state = cartReducer(undefined, addToCart({ product: makeProduct(), size: "M" }));
    state = cartReducer(state, removeFromCart({ productId: "prod-1", size: "M" }));
    expect(state.lines).toHaveLength(0);
  });

  it("clearCart empties lines and drops any applied coupon", () => {
    let state = cartReducer(undefined, addToCart({ product: makeProduct(), size: "M" }));
    state = cartReducer(state, setCoupon("welcome10"));
    state = cartReducer(state, clearCart());
    expect(state.lines).toHaveLength(0);
    expect(state.couponCode).toBe("");
  });

  it("setCoupon normalizes the code to uppercase and trims whitespace", () => {
    const state = cartReducer(undefined, setCoupon("  welcome10  "));
    expect(state.couponCode).toBe("WELCOME10");
  });

  it("clearCoupon resets the code without touching lines", () => {
    let state = cartReducer(undefined, addToCart({ product: makeProduct(), size: "M" }));
    state = cartReducer(state, setCoupon("WELCOME10"));
    state = cartReducer(state, clearCoupon());
    expect(state.couponCode).toBe("");
    expect(state.lines).toHaveLength(1);
  });

  it("getCartLineKey treats missing color as an empty string", () => {
    expect(getCartLineKey({ productId: "p1", size: "M" })).toBe(
      getCartLineKey({ productId: "p1", size: "M", color: "" })
    );
  });
});

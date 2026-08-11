import { afterEach, describe, expect, it, vi } from "vitest";
import checkoutReducer, {
  BUY_NOW_TTL_MS,
  clearBuyNow,
  isBuyNowIntentFresh,
  markCheckoutSubmitted,
  startBuyNow,
} from "./checkoutSlice";
import type { Product } from "@/types";

const product = {
  _id: "product-1",
  sku: "PW-001",
  name: "Patchwork Jacket",
  price: 3200,
  images: ["https://example.com/a.jpg"],
  size: "M",
  weightKg: 0.8,
} as unknown as Product;

afterEach(() => {
  vi.useRealTimers();
});

describe("checkoutSlice", () => {
  it("captures a single-item intent from the selected variant", () => {
    const state = checkoutReducer(undefined, startBuyNow({ product, size: "L", color: "Rust" }));

    expect(state.buyNow?.line).toEqual({
      productId: "product-1",
      sku: "PW-001",
      name: "Patchwork Jacket",
      price: 3200,
      image: "https://example.com/a.jpg",
      size: "L",
      color: "Rust",
      weightKg: 0.8,
    });
    expect(state.lastSubmittedMode).toBeNull();
  });

  it("defaults color to the one-of-one empty value", () => {
    const state = checkoutReducer(undefined, startBuyNow({ product, size: "M" }));

    expect(state.buyNow?.line.color).toBe("");
  });

  it("replaces an earlier intent rather than accumulating items", () => {
    let state = checkoutReducer(undefined, startBuyNow({ product, size: "M" }));
    state = checkoutReducer(state, startBuyNow({ product, size: "L", color: "Rust" }));

    expect(state.buyNow?.line.size).toBe("L");
  });

  it("clears the intent and its submitted mode", () => {
    let state = checkoutReducer(undefined, startBuyNow({ product, size: "M" }));
    state = checkoutReducer(state, markCheckoutSubmitted("buy-now"));
    state = checkoutReducer(state, clearBuyNow());

    expect(state).toEqual({ buyNow: null, lastSubmittedMode: null });
  });

  it("records which flow produced the pending order", () => {
    const state = checkoutReducer(undefined, markCheckoutSubmitted("cart"));

    expect(state.lastSubmittedMode).toBe("cart");
  });

  it("starting a new intent resets a stale submitted mode", () => {
    let state = checkoutReducer(undefined, markCheckoutSubmitted("cart"));
    state = checkoutReducer(state, startBuyNow({ product, size: "M" }));

    expect(state.lastSubmittedMode).toBeNull();
  });
});

describe("isBuyNowIntentFresh", () => {
  it("treats a missing intent as stale", () => {
    expect(isBuyNowIntentFresh(null)).toBe(false);
  });

  it("accepts an intent inside the TTL and rejects one past it", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-09T12:00:00.000Z"));
    const state = checkoutReducer(undefined, startBuyNow({ product, size: "M" }));
    const intent = state.buyNow!;

    expect(isBuyNowIntentFresh(intent, Date.now() + BUY_NOW_TTL_MS - 1000)).toBe(true);
    expect(isBuyNowIntentFresh(intent, Date.now() + BUY_NOW_TTL_MS)).toBe(false);
  });
});

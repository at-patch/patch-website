"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearCart } from "@/store/slices/cartSlice";
import { clearBuyNow } from "@/store/slices/checkoutSlice";

// Reaching the checkout success page always means an order was placed — Stripe
// only redirects here after checkout completes. Clearing here (rather than before
// the Stripe redirect) means cancelling or failing out of Stripe leaves the basket
// intact to retry.
//
// A Buy Now order consumes only its isolated intent, so a saved cart survives it.
export function ClearCartOnMount() {
  const dispatch = useAppDispatch();
  const lastSubmittedMode = useAppSelector((state) => state.checkout.lastSubmittedMode);

  useEffect(() => {
    if (lastSubmittedMode === "buy-now") {
      dispatch(clearBuyNow());
      return;
    }
    dispatch(clearCart());
    dispatch(clearBuyNow());
  }, [dispatch, lastSubmittedMode]);

  return null;
}

"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/store/hooks";
import { clearCart } from "@/store/slices/cartSlice";

// Reaching the checkout success page always means an order was placed —
// COD confirms immediately, Stripe only redirects here after checkout
// completes. Clearing here (rather than before the Stripe redirect) means
// cancelling or failing out of Stripe leaves the cart intact to retry.
export function ClearCartOnMount() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(clearCart());
  }, [dispatch]);

  return null;
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";

export function VerifyEmailStatus({ token }: { token: string }) {
  const [status, setStatus] = useState<"pending" | "success" | "error">("pending");
  const [message, setMessage] = useState("Verifying your email…");

  const verify = async () => {
    if (!token) {
      setStatus("error");
      setMessage("This verification link is missing a token.");
      return;
    }
    try {
      await axiosInstance.post("/account/verify-email", { token });
      setStatus("success");
      setMessage("Your email is verified.");
    } catch (err) {
      setStatus("error");
      setMessage(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Invalid or expired verification link."
      );
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- verifying on mount
    verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run if the token changes
  }, [token]);

  return (
    <div className="mt-6">
      <p className={status === "error" ? "text-sm text-red-600" : "text-sm text-patch-ink-muted"}>{message}</p>
      <Link href="/account" className="mt-4 inline-block text-sm underline underline-offset-4">
        Go to account
      </Link>
    </div>
  );
}

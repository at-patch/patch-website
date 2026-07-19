"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";

function VerifyEmailStatus() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("Verifying your email…");

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    axiosInstance
      .post("/account/verify-email", { token })
      .then(({ data }) => {
        if (cancelled) return;
        setStatus("success");
        setMessage(data.message);
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus("error");
        setMessage(
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            "Verification failed. Try requesting a new link."
        );
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!token) {
    return (
      <p className="mt-6 text-sm text-patch-ink-muted">
        This verification link is missing its token — use the link from your email.
      </p>
    );
  }

  return (
    <div className="mt-6">
      <p className="text-sm text-patch-ink-muted">{message}</p>
      {status !== "verifying" && (
        <Link
          href="/account"
          className="mt-6 inline-block rounded-full bg-patch-ink px-6 py-2.5 text-sm font-medium text-patch-bg hover:opacity-90"
        >
          Go to my account
        </Link>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="mx-auto max-w-sm px-6 py-24 text-center">
      <h1 className="font-heading text-2xl font-extrabold tracking-tight text-patch-ink">Email Verification</h1>
      <Suspense>
        <VerifyEmailStatus />
      </Suspense>
    </div>
  );
}

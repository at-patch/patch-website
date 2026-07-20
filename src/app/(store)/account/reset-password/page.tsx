"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import axiosInstance from "@/lib/axios";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await axiosInstance.post("/account/reset-password", { token, password });
      setMessage(data.message);
    } catch (err) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Something went wrong. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <p className="mt-8 text-sm text-patch-ink-muted">
        This reset link is missing its token — use the link from your email, or{" "}
        <Link href="/account/forgot-password" className="underline underline-offset-4">
          request a new one
        </Link>
        .
      </p>
    );
  }

  if (message) {
    return (
      <div className="mt-8">
        <p className="text-sm text-patch-ink">{message}</p>
        <Link
          href="/account/login"
          className="mt-6 inline-block rounded-full bg-patch-ink px-6 py-2.5 text-sm font-medium text-patch-bg hover:opacity-90"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <div>
        <label className="text-xs font-medium text-patch-ink-muted">New password</label>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-patch-line bg-transparent px-3 py-2 text-sm outline-none focus:border-patch-ink"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-patch-ink-muted">Confirm new password</label>
        <input
          type="password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="mt-1 w-full rounded-lg border border-patch-line bg-transparent px-3 py-2 text-sm outline-none focus:border-patch-ink"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-patch-ink px-6 py-2.5 text-sm font-medium text-patch-bg hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Saving…" : "Set new password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto max-w-sm px-6 py-24">
      <h1 className="font-heading text-2xl font-extrabold tracking-tight text-patch-ink">Choose a New Password</h1>
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}

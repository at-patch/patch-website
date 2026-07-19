"use client";

import Link from "next/link";
import { useState } from "react";
import axiosInstance from "@/lib/axios";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data } = await axiosInstance.post("/account/forgot-password", { email });
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

  return (
    <div className="mx-auto max-w-sm px-6 py-24">
      <h1 className="font-heading text-2xl font-extrabold tracking-tight text-patch-ink">Reset Password</h1>
      <p className="mt-2 text-sm text-patch-ink-muted">
        Enter your email and we&apos;ll send you a link to reset your password.
      </p>

      {message ? (
        <div className="mt-8">
          <p className="text-sm text-patch-ink">{message}</p>
          <Link href="/account/login" className="mt-4 inline-block text-sm underline underline-offset-4">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="text-xs font-medium text-patch-ink-muted">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-patch-line bg-transparent px-3 py-2 text-sm outline-none focus:border-patch-ink"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-patch-ink px-6 py-2.5 text-sm font-medium text-patch-bg hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Sending…" : "Send reset link"}
          </button>

          <p className="text-center text-sm text-patch-ink-muted">
            <Link href="/account/login" className="underline underline-offset-4">
              Back to sign in
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}

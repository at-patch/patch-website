"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import axiosInstance from "@/lib/axios";
import { ErrorBanner } from "@/components/admin/ui";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await axiosInstance.post("/admin/login", { email, password });
      router.push("/admin");
      router.refresh();
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Login failed.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-patch-bg-alt px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-5 rounded-2xl border border-patch-line bg-patch-bg p-8 shadow-[0_1px_2px_rgba(19,19,16,0.04)]"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-patch-ink text-patch-bg">
            <Lock size={18} />
          </div>
          <div>
            <p className="font-heading text-lg font-semibold tracking-tight text-patch-ink">PATCH Admin</p>
            <p className="mt-1 text-sm text-patch-ink-muted">Sign in to manage inventory, SKUs, and orders.</p>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-patch-ink-muted">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-patch-line bg-patch-bg px-3.5 py-2.5 text-sm text-patch-ink outline-none transition focus:border-patch-accent focus:ring-2 focus:ring-patch-accent/15"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-patch-ink-muted">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-patch-line bg-patch-bg px-3.5 py-2.5 text-sm text-patch-ink outline-none transition focus:border-patch-accent focus:ring-2 focus:ring-patch-accent/15"
          />
        </div>

        {error && <ErrorBanner>{error}</ErrorBanner>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-patch-ink px-6 py-2.5 text-sm font-medium text-patch-bg shadow-sm transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

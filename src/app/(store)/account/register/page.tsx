"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import axiosInstance from "@/lib/axios";

export default function AccountRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.post("/account/register", {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
      router.push("/account");
      router.refresh();
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Registration failed.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm px-6 py-24">
      <h1 className="font-heading text-2xl font-extrabold tracking-tight text-patch-ink">Create Account</h1>
      <p className="mt-2 text-sm text-patch-ink-muted">
        Already have an account?{" "}
        <Link href="/account/login" className="underline underline-offset-4">
          Sign in
        </Link>
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
        <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
        <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} required />
        <Field label="Password" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} required />
        <Field
          label="Confirm Password"
          type="password"
          value={form.confirmPassword}
          onChange={(v) => setForm({ ...form, confirmPassword: v })}
          required
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-patch-ink px-6 py-2.5 text-sm font-medium text-patch-bg hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Creating account…" : "Create Account"}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-patch-ink-muted">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-patch-line bg-transparent px-3 py-2 text-sm outline-none focus:border-patch-ink"
      />
    </div>
  );
}

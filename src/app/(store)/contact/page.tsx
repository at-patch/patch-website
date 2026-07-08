"use client";

import { useState } from "react";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import axiosInstance from "@/lib/axios";
import { FacebookIcon, InstagramIcon } from "@/components/ui/SocialIcons";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      await axiosInstance.post("/contact", form);
      setStatus("sent");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-patch-ink-muted">Contact</p>
      <h1 className="font-heading mt-2 text-3xl font-extrabold tracking-tight text-patch-ink">Get in Touch</h1>

      <div className="mt-10 grid gap-12 sm:grid-cols-2">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
            <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
          </div>
          <Field label="Subject" value={form.subject} onChange={(v) => setForm({ ...form, subject: v })} required />
          <div>
            <label className="text-xs font-medium text-patch-ink-muted">Message</label>
            <textarea
              required
              rows={5}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="mt-1 w-full rounded-lg border border-patch-line bg-transparent px-3 py-2 text-sm outline-none focus:border-patch-ink"
            />
          </div>

          {status === "sent" && (
            <p className="text-sm text-patch-accent">Thanks — we&apos;ll get back to you soon.</p>
          )}
          {status === "error" && (
            <p className="text-sm text-red-600">Something went wrong. Please try again.</p>
          )}

          <button
            type="submit"
            disabled={status === "sending"}
            className="rounded-full bg-patch-ink px-6 py-3 text-sm font-medium text-patch-bg hover:opacity-90 disabled:opacity-50"
          >
            {status === "sending" ? "Sending…" : "Send Message"}
          </button>
        </form>

        <div className="space-y-6">
          <div className="flex items-start gap-3">
            <MapPin size={18} className="mt-0.5 shrink-0 text-patch-accent" />
            <p className="text-sm text-patch-ink-muted">Dhaka, Bangladesh</p>
          </div>
          <div className="flex items-start gap-3">
            <Phone size={18} className="mt-0.5 shrink-0 text-patch-accent" />
            <p className="text-sm text-patch-ink-muted">+880 1XXX-XXXXXX</p>
          </div>
          <div className="flex items-start gap-3">
            <Mail size={18} className="mt-0.5 shrink-0 text-patch-accent" />
            <p className="text-sm text-patch-ink-muted">hello@atpatch.com</p>
          </div>
          <div className="flex items-start gap-3">
            <Clock size={18} className="mt-0.5 shrink-0 text-patch-accent" />
            <p className="text-sm text-patch-ink-muted">Sat–Thu, 10am–7pm (online orders only until our outlet opens)</p>
          </div>
          <div className="flex gap-3 pt-2">
            <a href="#" aria-label="Instagram" className="text-patch-ink-muted hover:text-patch-ink">
              <InstagramIcon size={18} />
            </a>
            <a href="#" aria-label="Facebook" className="text-patch-ink-muted hover:text-patch-ink">
              <FacebookIcon size={18} />
            </a>
          </div>
        </div>
      </div>
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

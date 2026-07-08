"use client";

import { useEffect } from "react";
import type { LucideIcon } from "lucide-react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const TONE_CLASSES = {
  green: "border-patch-accent/20 bg-patch-accent/10 text-patch-accent",
  teal: "border-patch-accent-2/20 bg-patch-accent-2/10 text-patch-accent-2",
  rust: "border-patch-accent-3/20 bg-patch-accent-3/10 text-patch-accent-3",
  neutral: "border-patch-line bg-patch-ink/5 text-patch-ink-muted",
  red: "border-red-500/20 bg-red-500/10 text-red-600",
} as const;

export type Tone = keyof typeof TONE_CLASSES;

const inputClass =
  "w-full rounded-xl border border-patch-line bg-patch-bg px-3.5 py-2.5 text-sm text-patch-ink outline-none transition placeholder:text-patch-ink-muted/60 focus:border-patch-accent focus:ring-2 focus:ring-patch-accent/15";

const inputIconClass = "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-patch-ink-muted/70";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-patch-line bg-patch-bg shadow-[0_1px_2px_rgba(19,19,16,0.04)]", className)}>
      {children}
    </div>
  );
}

export function PageHeader({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-patch-line pb-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-patch-ink/5 text-patch-ink">
            <Icon size={18} />
          </div>
        )}
        <div>
          <h1 className="font-heading text-xl font-semibold tracking-tight text-patch-ink sm:text-2xl">{title}</h1>
          {description && <p className="mt-0.5 text-sm text-patch-ink-muted">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

const BUTTON_VARIANTS = {
  primary: "bg-patch-ink text-patch-bg hover:opacity-90 shadow-sm",
  outline: "border border-patch-line text-patch-ink hover:bg-patch-ink/5",
  ghost: "text-patch-ink-muted hover:bg-patch-ink/5 hover:text-patch-ink",
  danger: "bg-red-600 text-white hover:bg-red-500",
} as const;

export function Button({
  variant = "primary",
  icon: Icon,
  className,
  children,
  ...props
}: {
  variant?: keyof typeof BUTTON_VARIANTS;
  icon?: LucideIcon;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        BUTTON_VARIANTS[variant],
        className
      )}
    >
      {Icon && <Icon size={15} />}
      {children}
    </button>
  );
}

export function IconButton({
  icon: Icon,
  label,
  tone = "neutral",
  className,
  ...props
}: {
  icon: LucideIcon;
  label: string;
  tone?: "neutral" | "danger";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-lg transition",
        tone === "danger" ? "text-red-500 hover:bg-red-500/10" : "text-patch-ink-muted hover:bg-patch-ink/5 hover:text-patch-ink",
        className
      )}
    >
      <Icon size={16} />
    </button>
  );
}

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium capitalize", TONE_CLASSES[tone])}>
      {children}
    </span>
  );
}

export function StatusPillSelect({
  value,
  tone,
  options,
  onChange,
}: {
  value: string;
  tone: Tone;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "cursor-pointer appearance-none rounded-full border px-3.5 py-2 pr-7 text-sm font-medium capitalize outline-none transition bg-[right_0.6rem_center] bg-no-repeat",
        TONE_CLASSES[tone]
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='3'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
      }}
    >
      {options.map((o) => (
        <option key={o} value={o} className="bg-patch-bg text-patch-ink">
          {o}
        </option>
      ))}
    </select>
  );
}

export function EmptyState({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-patch-ink/5 text-patch-ink-muted">
        <Icon size={20} />
      </div>
      <div>
        <p className="text-sm font-medium text-patch-ink">{title}</p>
        {description && <p className="mt-1 text-xs text-patch-ink-muted">{description}</p>}
      </div>
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  description,
  icon: Icon,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-16 sm:pt-24">
      <div className="fixed inset-0 bg-patch-ink/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-2xl rounded-2xl border border-patch-line bg-patch-bg shadow-2xl ring-1 ring-black/5"
      >
        <div className="flex items-center justify-between gap-4 border-b border-patch-line px-6 py-5">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-patch-accent/10 text-patch-accent">
                <Icon size={18} />
              </div>
            )}
            <div>
              <p className="font-heading text-base font-semibold tracking-tight text-patch-ink">{title}</p>
              {description && <p className="mt-0.5 text-xs text-patch-ink-muted">{description}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-patch-ink-muted transition hover:bg-patch-ink/5 hover:text-patch-ink"
          >
            <X size={16} />
          </button>
        </div>
        <div className="max-h-[calc(100vh-10rem)] overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

export function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-patch-line pt-5 first:border-t-0 first:pt-0 sm:col-span-2">
      <p className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-patch-ink-muted/80">{title}</p>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

export function TableCard({ children }: { children: React.ReactNode }) {
  return (
    <Card className="mt-6 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-[15px]">{children}</table>
      </div>
    </Card>
  );
}

export const tableHeadClass = "border-b border-patch-line bg-patch-bg-alt/60 text-left text-xs font-semibold uppercase tracking-wider text-patch-ink-muted";
export const tableRowClass = "transition-colors hover:bg-patch-ink/[0.02]";
export const tableCellClass = "px-6 py-5";

export function ErrorBanner({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-red-500/20 bg-red-500/5 px-3.5 py-2.5 text-sm text-red-600">{children}</p>
  );
}

export function FormInput({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  icon?: LucideIcon;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-patch-ink-muted">{label}</label>
      <div className="relative mt-1.5">
        {Icon && <Icon size={15} className={inputIconClass} />}
        <input
          type={type}
          required={required}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={cn(inputClass, Icon && "pl-10")}
        />
      </div>
    </div>
  );
}

export function FormTextarea({
  label,
  value,
  onChange,
  rows = 3,
  required,
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  required?: boolean;
  icon?: LucideIcon;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-patch-ink-muted">{label}</label>
      <div className="relative mt-1.5">
        {Icon && <Icon size={15} className="pointer-events-none absolute left-3.5 top-3.5 text-patch-ink-muted/70" />}
        <textarea
          required={required}
          value={value}
          rows={rows}
          onChange={(e) => onChange(e.target.value)}
          className={cn(inputClass, "resize-none", Icon && "pl-10")}
        />
      </div>
    </div>
  );
}

export function FormSelect({
  label,
  value,
  onChange,
  icon: Icon,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-patch-ink-muted">{label}</label>
      <div className="relative mt-1.5">
        {Icon && <Icon size={15} className={inputIconClass} />}
        <select value={value} onChange={(e) => onChange(e.target.value)} className={cn(inputClass, "cursor-pointer", Icon && "pl-10")}>
          {children}
        </select>
      </div>
    </div>
  );
}

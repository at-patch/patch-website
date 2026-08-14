"use client";

import Image from "next/image";
import { ImageOff } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Modal } from "@/components/admin/ui";
import { isValidImageSrc } from "@/lib/utils";

export type DetailField = {
  label: string;
  value: React.ReactNode;
  /** Let long prose (description, story) run the full width instead of one column. */
  wide?: boolean;
};

/**
 * Read-only view of one record. Deliberately not a form: editing stays in the
 * edit modal, so opening a record to look at it cannot change it by accident.
 */
export function DetailModal({
  open,
  onClose,
  icon,
  title,
  subtitle,
  images = [],
  fields,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  images?: string[];
  fields: DetailField[];
  children?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const usable = images.filter(isValidImageSrc);

  return (
    <Modal open={open} onClose={onClose} icon={icon} title={title} description={subtitle}>
      <div className="space-y-6">
        {images.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {usable.length === 0 ? (
              <div className="flex h-28 w-28 items-center justify-center rounded-xl border border-dashed border-patch-line text-patch-ink-muted/60">
                <ImageOff size={20} />
              </div>
            ) : (
              usable.map((src) => (
                <div
                  key={src}
                  className="relative h-28 w-28 overflow-hidden rounded-xl border border-patch-line bg-patch-bg-alt"
                >
                  <Image src={src} alt="" fill sizes="112px" className="object-cover" />
                </div>
              ))
            )}
          </div>
        )}

        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
          {fields.map((field) => (
            <div key={field.label} className={field.wide ? "sm:col-span-2" : undefined}>
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-patch-ink-muted/80">
                {field.label}
              </dt>
              <dd className="mt-1 text-sm text-patch-ink">{field.value}</dd>
            </div>
          ))}
        </dl>

        {children}

        {footer && <div className="flex flex-wrap items-center gap-3 border-t border-patch-line pt-5">{footer}</div>}
      </div>
    </Modal>
  );
}

/** A titled block inside a detail modal, for tag chips and variant tables. */
export function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-patch-line pt-5">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-patch-ink-muted/80">{title}</p>
      {children}
    </div>
  );
}

/** Renders a value that may be empty, so blank fields read as "—" not as nothing. */
export function orDash(value: React.ReactNode): React.ReactNode {
  if (value === null || value === undefined || value === "") {
    return <span className="text-patch-ink-muted">—</span>;
  }
  return value;
}

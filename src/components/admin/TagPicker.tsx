"use client";

import { useMemo, useState } from "react";
import { Check, Search, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { filterTagOptions, resolveTagOptions, toggleTag, type TagOption } from "@/lib/tag-options";

/**
 * Optional multi-select over a list of records. Used for tagging inventory items
 * with products, and patterns with both products and materials. Nothing here is
 * ever required — an untagged record is a normal record.
 */
export function TagPicker({
  label,
  options,
  value,
  onChange,
  loading,
  icon: Icon,
  placeholder = "Search by name or code",
  emptyText = "Nothing to tag yet.",
}: {
  label: string;
  options: TagOption[];
  value: string[];
  onChange: (ids: string[]) => void;
  loading?: boolean;
  icon?: LucideIcon;
  placeholder?: string;
  emptyText?: string;
}) {
  const [query, setQuery] = useState("");

  const selected = useMemo(() => resolveTagOptions(value, options), [value, options]);
  const matches = useMemo(() => filterTagOptions(options, query), [options, query]);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label className="text-xs font-medium text-patch-ink-muted">{label}</label>
        <span className="text-[11px] text-patch-ink-muted/70">
          Optional{value.length > 0 ? ` · ${value.length} tagged` : ""}
        </span>
      </div>

      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selected.map((option) => (
            <span
              key={option.id}
              className="inline-flex items-center gap-1.5 rounded-full border border-patch-accent/20 bg-patch-accent/10 px-2.5 py-1 text-xs text-patch-accent"
            >
              {option.label}
              <button
                type="button"
                onClick={() => onChange(toggleTag(value, option.id))}
                aria-label={`Remove tag ${option.label}`}
                className="rounded-full p-0.5 transition hover:bg-patch-accent/20"
              >
                <X size={11} />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-[11px] text-patch-ink-muted underline underline-offset-4 hover:text-patch-ink"
          >
            Clear all
          </button>
        </div>
      )}

      <div className="relative mt-2">
        <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-patch-ink-muted/70" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-patch-line bg-patch-bg py-2.5 pl-10 pr-3.5 text-sm text-patch-ink outline-none transition placeholder:text-patch-ink-muted/60 focus:border-patch-accent focus:ring-2 focus:ring-patch-accent/15"
        />
      </div>

      <div className="mt-2 max-h-52 overflow-y-auto rounded-xl border border-patch-line">
        {loading ? (
          <div className="animate-pulse space-y-2 p-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-9 rounded-lg bg-patch-ink/5" />
            ))}
          </div>
        ) : matches.length === 0 ? (
          <p className="px-3.5 py-6 text-center text-xs text-patch-ink-muted">
            {options.length === 0 ? emptyText : "Nothing matches that search."}
          </p>
        ) : (
          <ul className="divide-y divide-patch-line">
            {matches.map((option) => {
              const isTagged = value.includes(option.id);
              return (
                <li key={option.id}>
                  <button
                    type="button"
                    onClick={() => onChange(toggleTag(value, option.id))}
                    aria-pressed={isTagged}
                    className={cn(
                      "flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-sm transition",
                      isTagged ? "bg-patch-accent/5 text-patch-ink" : "text-patch-ink-muted hover:bg-patch-ink/5"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition",
                        isTagged ? "border-patch-accent bg-patch-accent text-patch-bg" : "border-patch-line"
                      )}
                    >
                      {isTagged && <Check size={11} />}
                    </span>
                    {Icon && <Icon size={14} className="shrink-0 text-patch-ink-muted/70" />}
                    <span className="min-w-0 flex-1 truncate text-patch-ink">{option.label}</span>
                    {option.hint && (
                      <span className="shrink-0 text-[11px] text-patch-ink-muted">{option.hint}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

/** Read-only chips for a table cell. Renders an em dash when nothing is tagged. */
export function TagCell({
  ids,
  options,
  tone = "accent",
}: {
  ids: string[];
  options: TagOption[];
  tone?: "accent" | "teal";
}) {
  const tagged = resolveTagOptions(ids, options);
  // A tagged record can be deleted without its tags being cleaned up, so say so
  // rather than silently showing fewer chips than were saved.
  const missing = countMissing(ids, tagged.length);

  if (ids.length === 0) return <span className="text-patch-ink-muted">—</span>;

  return (
    <div className="flex max-w-[16rem] flex-wrap gap-1">
      {tagged.map((option) => (
        <span
          key={option.id}
          title={option.hint}
          className={cn(
            "inline-flex max-w-full items-center truncate rounded-full border px-2 py-0.5 text-[11px]",
            tone === "teal"
              ? "border-patch-accent-2/20 bg-patch-accent-2/10 text-patch-accent-2"
              : "border-patch-accent/20 bg-patch-accent/10 text-patch-accent"
          )}
        >
          {option.label}
        </span>
      ))}
      {missing > 0 && (
        <span
          title="Tagged records that have since been deleted"
          className="inline-flex items-center rounded-full border border-patch-line bg-patch-ink/5 px-2 py-0.5 text-[11px] text-patch-ink-muted"
        >
          {missing} removed
        </span>
      )}
    </div>
  );
}

function countMissing(ids: string[], resolved: number) {
  return ids.length - resolved;
}

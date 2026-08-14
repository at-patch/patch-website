// Presentational admin primitives with no hooks, handlers, or browser APIs.
//
// Deliberately NOT marked "use client": these are the pieces server components
// render, and an icon passed as `icon={SomeIcon}` is a function, which cannot
// cross a server/client boundary. Keeping them server-safe is what lets a server
// page pass an icon at all. ui.tsx re-exports everything here, so existing
// client imports from "@/components/admin/ui" keep working unchanged.
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const TONE_CLASSES = {
  green: "border-patch-accent/20 bg-patch-accent/10 text-patch-accent",
  teal: "border-patch-accent-2/20 bg-patch-accent-2/10 text-patch-accent-2",
  rust: "border-patch-accent-3/20 bg-patch-accent-3/10 text-patch-accent-3",
  neutral: "border-patch-line bg-patch-ink/5 text-patch-ink-muted",
  red: "border-red-500/20 bg-red-500/10 text-red-600",
} as const;

export type Tone = keyof typeof TONE_CLASSES;

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
    <div className="flex flex-col gap-4 border-b border-patch-line pb-5 sm:flex-row sm:items-center sm:justify-between sm:pb-6">
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

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium capitalize", TONE_CLASSES[tone])}>
      {children}
    </span>
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

// Denser cell for the wide reference tables (inventory, patterns), where the
// generous px-6 py-5 spends width that the columns themselves need.
export const tableCellCompact = "px-4 py-3.5 align-middle";

// Headers wrap onto two lines as soon as a table gets tight, which is what makes
// a wide table look broken rather than merely wide.
export const tableHeadCellClass = "whitespace-nowrap";

/**
 * Pins the actions column to the right edge of the horizontal scroll container.
 * Without this a wide table simply clips its own row controls: the buttons are
 * still there, just scrolled out of sight past the last visible column.
 */
export const tableActionsCellClass =
  "sticky right-0 z-10 border-l border-patch-line bg-patch-bg";
export const tableActionsHeadClass =
  "sticky right-0 z-20 border-l border-patch-line bg-patch-bg-alt";

/**
 * Mobile counterpart to TableCard: stacked cards below `sm`, nothing from `sm` up.
 *
 * Lives here rather than in ui.tsx so server components can use it too — a
 * "use client" version would take `renderItem` as a prop, and a function cannot
 * cross the server/client boundary.
 */
export function MobileCards<T>({
  items,
  loading,
  empty,
  renderItem,
  skeletonRows = 3,
}: {
  items: T[];
  loading?: boolean;
  empty: React.ReactNode;
  renderItem: (item: T, index: number) => React.ReactNode;
  skeletonRows?: number;
}) {
  return (
    <div className="mt-6 space-y-3 sm:hidden">
      {loading ? (
        Array.from({ length: skeletonRows }, (_, i) => (
          <Card key={i} className="animate-pulse p-4">
            <div className="h-4 w-28 rounded bg-patch-ink/5" />
            <div className="mt-3 h-4 w-44 rounded bg-patch-ink/5" />
            <div className="mt-3 h-8 w-full rounded bg-patch-ink/5" />
          </Card>
        ))
      ) : items.length === 0 ? (
        <Card>{empty}</Card>
      ) : (
        items.map(renderItem)
      )}
    </div>
  );
}

/** Label/value pair for the stacked cards. */
export function MobileField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-patch-ink-muted">{label}</dt>
      <dd className="mt-0.5 truncate text-sm text-patch-ink">{children}</dd>
    </div>
  );
}

/** Bottom action strip for a stacked card. */
export function MobileActions({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 flex flex-wrap items-center justify-end gap-1 border-t border-patch-line pt-3">
      {children}
    </div>
  );
}

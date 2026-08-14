"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import { ORDER_TABS, type OrderTab, type OrderTabCounts } from "@/lib/order-buckets";

const TAB_LABELS: Record<OrderTab, string> = {
  pending: "Pending",
  overdue: "Overdue",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function orderTabPanelId(tab: OrderTab) {
  return `orders-panel-${tab}`;
}

function tabId(tab: OrderTab) {
  return `orders-tab-${tab}`;
}

export default function OrderTabBar({
  active,
  counts,
  loading,
  onChange,
}: {
  active: OrderTab;
  counts: OrderTabCounts;
  loading: boolean;
  onChange: (tab: OrderTab) => void;
}) {
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Roving focus: left/right wrap around the bar and activate as they go, which is
  // the expected behaviour for an automatic-activation tablist.
  const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
    const delta = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (delta === 0) return;
    event.preventDefault();
    const next = ORDER_TABS[(index + delta + ORDER_TABS.length) % ORDER_TABS.length];
    onChange(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label="Order buckets"
      className="mt-6 flex w-full gap-1 overflow-x-auto rounded-2xl border border-patch-line bg-patch-bg-alt/60 p-1 sm:w-auto sm:inline-flex"
    >
      {ORDER_TABS.map((tab, index) => {
        const isActive = tab === active;
        const count = counts[tab];
        // The whole point of the Overdue tab is to be noticeable from the other three,
        // so its badge stays rust even while another tab is selected.
        const alarming = tab === "overdue" && count > 0;

        return (
          <button
            key={tab}
            ref={(node) => {
              tabRefs.current[tab] = node;
            }}
            type="button"
            role="tab"
            id={tabId(tab)}
            aria-selected={isActive}
            aria-controls={orderTabPanelId(tab)}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition outline-none focus-visible:ring-2 focus-visible:ring-patch-accent/40",
              isActive
                ? "bg-patch-ink text-patch-bg shadow-sm"
                : "text-patch-ink-muted hover:bg-patch-ink/5 hover:text-patch-ink"
            )}
          >
            {TAB_LABELS[tab]}
            <span
              aria-hidden={loading}
              className={cn(
                "inline-flex min-w-6 items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-semibold tabular-nums transition",
                alarming
                  ? "bg-patch-accent-3/15 text-patch-accent-3"
                  : isActive
                    ? "bg-patch-bg/20 text-patch-bg"
                    : "bg-patch-ink/5 text-patch-ink-muted",
                // Dim rather than hide while counts are in flight, so the bar keeps
                // its width and nothing reflows as numbers land.
                loading && "opacity-40"
              )}
            >
              {count}
            </span>
            <span className="sr-only">
              {count} {count === 1 ? "order" : "orders"}
            </span>
          </button>
        );
      })}
    </div>
  );
}

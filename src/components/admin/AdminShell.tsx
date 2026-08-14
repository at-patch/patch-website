"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { SidebarNav } from "@/components/admin/Sidebar";

/**
 * Admin chrome. The sidebar is a static column from `lg` up and an off-canvas
 * drawer below it — at 375px a permanent 256px rail leaves no room for content.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Navigating inside the drawer should close it, or the new page is hidden
  // behind the panel that was used to reach it.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- closing on route change is the intended effect of navigating
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <div className="flex min-h-screen bg-patch-bg">
      {/* Desktop: a permanent rail, pinned to the viewport. Without sticky + h-screen
          it is only as tall as its own contents, so scrolling a long page carries the
          nav away and leaves the rail's background ending mid-page. */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-patch-line bg-patch-bg-alt/40 px-4 py-6 lg:flex">
        <SidebarNav />
      </aside>

      {/* Mobile: the same nav as a drawer. */}
      {/* `inert` matters as much as pointer-events here: a translated-off-screen
          panel still keeps its links in the tab order without it. */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${open ? "" : "pointer-events-none"}`}
        aria-hidden={!open}
        inert={!open}
      >
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-patch-ink/50 backdrop-blur-sm transition-opacity duration-200 ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Admin navigation"
          className={`absolute inset-y-0 left-0 flex w-[17rem] max-w-[85vw] flex-col border-r border-patch-line bg-patch-bg px-4 py-6 shadow-2xl transition-transform duration-200 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
            className="absolute right-3 top-5 flex h-9 w-9 items-center justify-center rounded-lg text-patch-ink-muted transition hover:bg-patch-ink/5 hover:text-patch-ink"
          >
            <X size={16} />
          </button>
          <SidebarNav />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar: the only way to reach the nav below lg. */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-patch-line bg-patch-bg/95 px-4 py-3 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
            aria-expanded={open}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-patch-line text-patch-ink transition hover:bg-patch-ink/5"
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-patch-ink font-heading text-xs font-semibold text-patch-bg">
              P
            </div>
            <div>
              <p className="font-heading text-sm font-semibold leading-tight tracking-tight text-patch-ink">PATCH</p>
              <p className="text-[11px] leading-tight text-patch-ink-muted">Admin</p>
            </div>
          </div>
        </header>

        {/* min-w-0 so a wide table scrolls inside main instead of stretching the page. */}
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-10">
          <div className="mx-auto min-w-0 max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

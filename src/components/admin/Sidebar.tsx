"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  Boxes,
  LayoutDashboard,
  LogOut,
  Mail,
  Package,
  Percent,
  Recycle,
  Scissors,
  Settings2,
  ShoppingCart,
  Tags,
  TrendingUp,
  UserCog,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import axiosInstance from "@/lib/axios";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/inventory", label: "Inventory", icon: Recycle },
  { href: "/admin/patterns", label: "Patterns", icon: Scissors },
  { href: "/admin/products", label: "Products / SKUs", icon: Package },
  { href: "/admin/product-batches", label: "Product Batches", icon: Boxes },
  { href: "/admin/top-selling", label: "Top Selling", icon: TrendingUp },
  { href: "/admin/homepage-settings", label: "Storefront Settings", icon: Settings2 },
  { href: "/admin/about-settings", label: "About Settings", icon: BookOpen },
  { href: "/admin/utilities", label: "Utilities", icon: Settings2 },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/coupons", label: "Coupons", icon: Percent },
  { href: "/admin/journal", label: "Journal", icon: BookOpen },
  { href: "/admin/contact", label: "Contact", icon: Mail },
  { href: "/admin/leads", label: "Leads", icon: UserPlus },
  { href: "/admin/admins", label: "Admins", icon: UserCog },
];

/**
 * Nav contents only — the surrounding <aside> (rail) or drawer panel is supplied
 * by AdminShell, so both presentations render exactly the same links.
 */
export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await axiosInstance.post("/admin/logout");
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <>
      <div className="mb-8 flex items-center gap-2.5 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-patch-ink font-heading text-sm font-semibold text-patch-bg">
          P
        </div>
        <div>
          <p className="font-heading text-sm font-semibold leading-tight tracking-tight text-patch-ink">PATCH</p>
          <p className="text-[11px] leading-tight text-patch-ink-muted">Admin</p>
        </div>
      </div>

      <nav className="-mx-1 flex-1 space-y-1 overflow-y-auto px-1">
        {LINKS.map((link) => {
          const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-patch-ink text-patch-bg shadow-sm"
                  : "text-patch-ink-muted hover:bg-patch-ink/5 hover:text-patch-ink"
              )}
            >
              <link.icon size={16} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={handleLogout}
        className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-patch-ink-muted transition-colors hover:bg-patch-ink/5 hover:text-patch-ink"
      >
        <LogOut size={16} />
        Sign out
      </button>
    </>
  );
}

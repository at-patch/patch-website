import { Recycle, RotateCcw, Truck } from "lucide-react";

const BADGES = [
  { icon: Truck, label: "Free Dhaka Shipping", body: "On orders over 5,000 BDT", color: "var(--patch-accent)" },
  { icon: RotateCcw, label: "Size/Fit Exchanges", body: "No cash refunds or returns", color: "var(--patch-accent-2)" },
  { icon: Recycle, label: "Responsibly Made", body: "Less waste, by design", color: "var(--patch-accent-3)" },
];

export function TrustBadges() {
  return (
    <section className="border-y border-patch-line py-12">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 sm:grid-cols-3">
        {BADGES.map((badge) => (
          <div key={badge.label} className="flex items-center gap-3">
            <badge.icon size={22} className="shrink-0" style={{ color: badge.color }} />
            <div>
              <p className="text-sm font-semibold text-patch-ink">{badge.label}</p>
              <p className="text-xs text-patch-ink-muted">{badge.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

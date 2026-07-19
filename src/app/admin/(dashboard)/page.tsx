import { CheckCircle2, LayoutDashboard, Recycle, ShoppingCart, TrendingUp, Wallet } from "lucide-react";
import { connectToDatabase } from "@/lib/db";
import ProductModel from "@/lib/models/Product";
import InventoryItemModel from "@/lib/models/InventoryItem";
import OrderModel from "@/lib/models/Order";
import { Card, PageHeader } from "@/components/admin/ui";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TREND_DAYS = 30;

async function getStats() {
  await connectToDatabase();
  const [available, sold, inventoryRaw, openOrders] = await Promise.all([
    ProductModel.countDocuments({ status: "available" }),
    ProductModel.countDocuments({ status: "sold" }),
    InventoryItemModel.countDocuments({ status: "raw" }),
    OrderModel.countDocuments({ status: { $in: ["placed", "confirmed", "processing"] } }),
  ]);
  return { available, sold, inventoryRaw, openOrders };
}

async function getRevenueStats() {
  await connectToDatabase();

  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (TREND_DAYS - 1));

  const [dailyRaw, totalsRaw, topProductsRaw] = await Promise.all([
    OrderModel.aggregate([
      { $match: { paymentStatus: "paid", createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$total" },
        },
      },
    ]),
    OrderModel.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, revenue: { $sum: "$total" }, orders: { $sum: 1 } } },
    ]),
    OrderModel.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          name: { $first: "$items.name" },
          qty: { $sum: 1 },
          revenue: { $sum: "$items.price" },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]),
  ]);

  // Fill in zero-revenue days so the chart always spans a full TREND_DAYS range.
  const dailyMap = new Map<string, number>(dailyRaw.map((d) => [d._id as string, d.revenue as number]));
  const dailyRevenue = Array.from({ length: TREND_DAYS }, (_, i) => {
    const day = new Date(since);
    day.setDate(day.getDate() + i);
    const key = day.toISOString().slice(0, 10);
    return { date: key, revenue: dailyMap.get(key) ?? 0 };
  });

  const totals = (totalsRaw[0] as { revenue: number; orders: number } | undefined) ?? { revenue: 0, orders: 0 };

  return {
    dailyRevenue,
    totalRevenue: totals.revenue,
    paidOrders: totals.orders,
    averageOrderValue: totals.orders > 0 ? Math.round(totals.revenue / totals.orders) : 0,
    topProducts: topProductsRaw as { _id: string; name: string; qty: number; revenue: number }[],
  };
}

export default async function AdminDashboardPage() {
  const [stats, revenue] = await Promise.all([getStats(), getRevenueStats()]);

  const revenueCards = [
    { label: "Total revenue", value: formatPrice(revenue.totalRevenue), icon: Wallet, tone: "bg-patch-accent/10 text-patch-accent" },
    { label: "Paid orders", value: revenue.paidOrders, icon: ShoppingCart, tone: "bg-patch-accent-2/10 text-patch-accent-2" },
    { label: "Avg. order value", value: formatPrice(revenue.averageOrderValue), icon: TrendingUp, tone: "bg-patch-accent-3/10 text-patch-accent-3" },
  ];

  const inventoryCards = [
    { label: "Live SKUs", value: stats.available, icon: CheckCircle2, tone: "bg-patch-accent/10 text-patch-accent" },
    { label: "Sold pieces", value: stats.sold, icon: ShoppingCart, tone: "bg-patch-accent-2/10 text-patch-accent-2" },
    { label: "Raw inventory pending", value: stats.inventoryRaw, icon: Recycle, tone: "bg-patch-accent-3/10 text-patch-accent-3" },
    { label: "Open orders", value: stats.openOrders, icon: LayoutDashboard, tone: "bg-patch-ink/5 text-patch-ink" },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" description="A snapshot of what's moving across the shop right now." />

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {revenueCards.map((card) => (
          <Card key={card.label} className="p-5">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.tone}`}>
              <card.icon size={17} />
            </div>
            <p className="mt-4 text-3xl font-semibold tracking-tight text-patch-ink">{card.value}</p>
            <p className="mt-1 text-xs text-patch-ink-muted">{card.label}</p>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-patch-ink-muted">
            Revenue — last {TREND_DAYS} days
          </p>
          <div className="mt-4">
            <RevenueChart data={revenue.dailyRevenue} />
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-patch-ink-muted">Top selling</p>
          {revenue.topProducts.length === 0 ? (
            <p className="mt-4 text-sm text-patch-ink-muted">No paid orders yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {revenue.topProducts.map((product, i) => (
                <li key={product._id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="shrink-0 text-xs text-patch-ink-muted">{i + 1}.</span>
                    <span className="truncate text-patch-ink">{product.name}</span>
                  </span>
                  <span className="shrink-0 text-patch-ink-muted">{formatPrice(product.revenue)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {inventoryCards.map((card) => (
          <Card key={card.label} className="p-5">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.tone}`}>
              <card.icon size={17} />
            </div>
            <p className="mt-4 text-3xl font-semibold tracking-tight text-patch-ink">{card.value}</p>
            <p className="mt-1 text-xs text-patch-ink-muted">{card.label}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

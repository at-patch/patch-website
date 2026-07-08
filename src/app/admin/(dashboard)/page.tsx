import { CheckCircle2, LayoutDashboard, Recycle, ShoppingCart } from "lucide-react";
import { connectToDatabase } from "@/lib/db";
import ProductModel from "@/lib/models/Product";
import InventoryItemModel from "@/lib/models/InventoryItem";
import OrderModel from "@/lib/models/Order";
import { Card, PageHeader } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

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

export default async function AdminDashboardPage() {
  const stats = await getStats();

  const cards = [
    { label: "Live SKUs", value: stats.available, icon: CheckCircle2, tone: "bg-patch-accent/10 text-patch-accent" },
    { label: "Sold pieces", value: stats.sold, icon: ShoppingCart, tone: "bg-patch-accent-2/10 text-patch-accent-2" },
    { label: "Raw inventory pending", value: stats.inventoryRaw, icon: Recycle, tone: "bg-patch-accent-3/10 text-patch-accent-3" },
    { label: "Open orders", value: stats.openOrders, icon: LayoutDashboard, tone: "bg-patch-ink/5 text-patch-ink" },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" description="A snapshot of what's moving across the shop right now." />
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map((card) => (
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

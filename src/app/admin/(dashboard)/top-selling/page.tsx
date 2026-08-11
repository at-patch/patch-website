import Image from "next/image";
import { TrendingUp } from "lucide-react";
import {
  EmptyState,
  PageHeader,
  TableCard,
  tableCellClass,
  tableHeadClass,
  tableRowClass,
} from "@/components/admin/ui";
import { TOP_SELLING_LIMIT, getTopSellingProducts } from "@/lib/best-sellers";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function TopSellingPage() {
  const products = await getTopSellingProducts(TOP_SELLING_LIMIT);
  const totalUnits = products.reduce((sum, product) => sum + product.units, 0);
  const totalRevenue = products.reduce((sum, product) => sum + product.revenue, 0);

  return (
    <div>
      <PageHeader
        icon={TrendingUp}
        title={`Top ${TOP_SELLING_LIMIT} Selling`}
        description="Ranked by units sold from paid, non-refunded orders. Ties break on revenue, then on the most recent sale. Revenue is shown in canonical BDT so multi-currency orders never mix."
      />

      {products.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-patch-line bg-patch-bg p-5">
            <p className="text-3xl font-semibold tracking-tight text-patch-ink">{products.length}</p>
            <p className="mt-1 text-xs text-patch-ink-muted">Ranked products</p>
          </div>
          <div className="rounded-2xl border border-patch-line bg-patch-bg p-5">
            <p className="text-3xl font-semibold tracking-tight text-patch-ink">{totalUnits}</p>
            <p className="mt-1 text-xs text-patch-ink-muted">Units sold</p>
          </div>
          <div className="rounded-2xl border border-patch-line bg-patch-bg p-5">
            <p className="text-3xl font-semibold tracking-tight text-patch-ink">{formatPrice(totalRevenue)}</p>
            <p className="mt-1 text-xs text-patch-ink-muted">Revenue (BDT)</p>
          </div>
        </div>
      )}

      <TableCard>
        <thead className={tableHeadClass}>
          <tr>
            <th className={tableCellClass}>#</th>
            <th className={tableCellClass}>Product</th>
            <th className={tableCellClass}>SKU</th>
            <th className={tableCellClass}>Units sold</th>
            <th className={tableCellClass}>Revenue (BDT)</th>
            <th className={tableCellClass}>Last sold</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-patch-line">
          {products.length === 0 ? (
            <tr>
              <td colSpan={6}>
                <EmptyState
                  icon={TrendingUp}
                  title="No paid orders yet"
                  description="Sales ranking appears once orders are confirmed as paid by the Stripe webhook."
                />
              </td>
            </tr>
          ) : (
            products.map((product, index) => (
              <tr key={product.productId} className={tableRowClass}>
                <td className={`${tableCellClass} text-patch-ink-muted`}>{index + 1}</td>
                <td className={tableCellClass}>
                  <div className="flex items-center gap-3">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt=""
                        width={40}
                        height={40}
                        className="h-10 w-10 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <span className="h-10 w-10 shrink-0 rounded-lg bg-patch-ink/5" />
                    )}
                    <span className="font-medium text-patch-ink">{product.name}</span>
                  </div>
                </td>
                <td className={`${tableCellClass} text-patch-ink-muted`}>{product.sku || "—"}</td>
                <td className={`${tableCellClass} font-medium text-patch-ink`}>{product.units}</td>
                <td className={`${tableCellClass} text-patch-ink-muted`}>{formatPrice(product.revenue)}</td>
                <td className={`${tableCellClass} text-patch-ink-muted`}>{formatDate(product.lastSoldAt)}</td>
              </tr>
            ))
          )}
        </tbody>
      </TableCard>

      <p className="mt-4 text-xs text-patch-ink-muted">
        Use this report to decide which products belong in the curated “Top 10 Best Sellers” section on
        Storefront Settings → Shop page sections.
      </p>
    </div>
  );
}

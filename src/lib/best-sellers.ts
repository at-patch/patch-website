import type { PipelineStage } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import OrderModel from "@/lib/models/Order";

export const TOP_SELLING_LIMIT = 10;

export type TopSellingProduct = {
  productId: string;
  name: string;
  sku: string;
  image: string;
  units: number;
  /** Canonical BDT revenue — never the converted charged amount, so currencies never mix. */
  revenue: number;
  lastSoldAt: string | null;
};

type TopSellingRow = {
  _id: unknown;
  name?: string;
  sku?: string;
  image?: string;
  units?: number;
  revenue?: number;
  lastSoldAt?: Date | string | null;
};

/**
 * Ranking basis (decision D8): units sold from paid, non-refunded, non-cancelled
 * orders. Ties break on canonical revenue, then on the most recent sale.
 *
 * Order items carry no quantity field — cart identity is product + size + color and
 * each line is a single unit — so one item document equals one unit sold.
 */
export function buildTopSellingPipeline(limit: number = TOP_SELLING_LIMIT): PipelineStage[] {
  return [
    { $match: { paymentStatus: "paid", status: { $ne: "cancelled" } } },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.product",
        name: { $first: "$items.name" },
        sku: { $first: "$items.sku" },
        image: { $first: "$items.image" },
        units: { $sum: 1 },
        revenue: { $sum: { $ifNull: ["$items.basePrice", "$items.price"] } },
        lastSoldAt: { $max: "$createdAt" },
      },
    },
    { $sort: { units: -1, revenue: -1, lastSoldAt: -1 } },
    { $limit: limit },
  ];
}

function toTopSellingProduct(row: TopSellingRow): TopSellingProduct {
  return {
    productId: row._id ? String(row._id) : "",
    // Historical item names are preserved so deleted products still report sensibly.
    name: row.name ?? "Unknown product",
    sku: row.sku ?? "",
    image: row.image ?? "",
    units: row.units ?? 0,
    revenue: row.revenue ?? 0,
    lastSoldAt: row.lastSoldAt ? new Date(row.lastSoldAt).toISOString() : null,
  };
}

export function mapTopSellingRows(rows: TopSellingRow[]): TopSellingProduct[] {
  return rows.map(toTopSellingProduct);
}

export async function getTopSellingProducts(limit: number = TOP_SELLING_LIMIT) {
  await connectToDatabase();
  const rows = (await OrderModel.aggregate(buildTopSellingPipeline(limit))) as TopSellingRow[];
  return mapTopSellingRows(rows);
}

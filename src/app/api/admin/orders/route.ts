import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import OrderModel from "@/lib/models/Order";
import { requireAdmin } from "@/lib/require-admin";
import { ORDER_TABS, buildTabFilter, tabSort, type OrderTabCounts } from "@/lib/order-buckets";
import { adminOrderQuerySchema } from "@/lib/validation/order.schemas";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

  await connectToDatabase();
  const { searchParams } = new URL(request.url);

  // Empty values are dropped rather than validated: `?status=` is how the UI spells
  // "no filter", and it predates this route being schema-validated.
  const rawQuery = Object.fromEntries(
    [...searchParams.entries()].filter(([, value]) => value !== "")
  );

  const parsed = adminOrderQuerySchema.safeParse(rawQuery);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid query.";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }

  const { status, paymentStatus, tab, page, limit } = parsed.data;
  const now = new Date();

  // status/paymentStatus stay merged as plain fields so existing bookmarked filter
  // URLs produce the exact same query; a tab composes on top via $and rather than
  // overwriting the status key it also constrains.
  const explicitFilter: Record<string, unknown> = {};
  if (status) explicitFilter.status = status;
  if (paymentStatus) explicitFilter.paymentStatus = paymentStatus;

  const filter = !tab
    ? explicitFilter
    : Object.keys(explicitFilter).length === 0
      ? buildTabFilter(tab, now)
      : { $and: [buildTabFilter(tab, now), explicitFilter] };

  // One round trip serves every badge, so the counts can never disagree with the rows
  // they sit above. Counts are over all orders, independent of the active tab.
  const countStages = Object.fromEntries(
    ORDER_TABS.map((name) => [name, [{ $match: buildTabFilter(name, now) }, { $count: "count" }]])
  );

  const [orders, total, facet] = await Promise.all([
    OrderModel.find(filter)
      .sort(tabSort(tab))
      .skip((page - 1) * limit)
      .limit(limit),
    OrderModel.countDocuments(filter),
    OrderModel.aggregate([{ $facet: countStages }]),
  ]);

  const buckets = (facet?.[0] ?? {}) as Record<string, { count?: number }[] | undefined>;
  const tabCounts = Object.fromEntries(
    ORDER_TABS.map((name) => [name, buckets[name]?.[0]?.count ?? 0])
  ) as OrderTabCounts;

  return NextResponse.json({ success: true, data: orders, total, page, limit, tabCounts });
}

"use client";

import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";
import axiosInstance from "@/lib/axios";
import { formatPrice } from "@/lib/utils";
import {
  EmptyState,
  PageHeader,
  StatusPillSelect,
  TableCard,
  tableCellClass,
  tableHeadClass,
  tableRowClass,
  type Tone,
} from "@/components/admin/ui";
import type { ApiListResponse, Order, OrderStatus } from "@/types";

const STATUSES: OrderStatus[] = ["placed", "confirmed", "processing", "shipped", "delivered", "cancelled"];

const STATUS_TONE: Record<OrderStatus, Tone> = {
  placed: "rust",
  confirmed: "teal",
  processing: "teal",
  shipped: "teal",
  delivered: "green",
  cancelled: "neutral",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await axiosInstance.get<ApiListResponse<Order>>("/admin/orders");
    setOrders(data.data);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount
    load();
  }, []);

  const updateStatus = async (id: string, status: OrderStatus) => {
    await axiosInstance.patch(`/admin/orders/${id}`, { status });
    load();
  };

  return (
    <div>
      <PageHeader icon={ShoppingCart} title="Orders" description="Track fulfillment from placed to delivered." />

      <TableCard>
        <thead className={tableHeadClass}>
          <tr>
            <th className={tableCellClass}>Order #</th>
            <th className={tableCellClass}>Customer</th>
            <th className={tableCellClass}>Items</th>
            <th className={tableCellClass}>Total</th>
            <th className={tableCellClass}>Payment</th>
            <th className={tableCellClass}>Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-patch-line">
          {loading ? (
            <tr>
              <td colSpan={6}>
                <div className="animate-pulse space-y-3 p-6">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-14 rounded-lg bg-patch-ink/5" />
                  ))}
                </div>
              </td>
            </tr>
          ) : orders.length === 0 ? (
            <tr>
              <td colSpan={6}>
                <EmptyState icon={ShoppingCart} title="No orders yet" description="Orders will show up here as customers check out." />
              </td>
            </tr>
          ) : (
            orders.map((order) => (
              <tr key={order._id} className={tableRowClass}>
                <td className={`${tableCellClass} font-medium text-patch-ink`}>{order.orderNumber}</td>
                <td className={tableCellClass}>
                  <p className="text-patch-ink">{order.shippingAddress.fullName}</p>
                  <p className="text-xs text-patch-ink-muted">{order.shippingAddress.phone} · {order.shippingAddress.area}</p>
                </td>
                <td className={`${tableCellClass} text-patch-ink-muted`}>{order.items.length}</td>
                <td className={`${tableCellClass} text-patch-ink`}>{formatPrice(order.total, order.currency)}</td>
                <td className={`${tableCellClass} capitalize text-patch-ink-muted`}>{order.paymentMethod} · {order.paymentStatus}</td>
                <td className={tableCellClass}>
                  <StatusPillSelect
                    value={order.status}
                    tone={STATUS_TONE[order.status]}
                    options={STATUSES}
                    onChange={(v) => updateStatus(order._id, v as OrderStatus)}
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </TableCard>
    </div>
  );
}

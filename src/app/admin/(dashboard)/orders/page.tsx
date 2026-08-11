"use client";

import { useEffect, useState } from "react";
import { ShoppingCart, Truck } from "lucide-react";
import axiosInstance from "@/lib/axios";
import { formatPrice } from "@/lib/utils";
import {
  Badge,
  Button,
  EmptyState,
  PageHeader,
  StatusPillSelect,
  TableCard,
  tableCellClass,
  tableHeadClass,
  tableRowClass,
  type Tone,
} from "@/components/admin/ui";
import type { ApiListResponse, Order, OrderStatus, PaymentStatus } from "@/types";

const STATUSES: OrderStatus[] = ["placed", "confirmed", "processing", "shipped", "delivered", "cancelled"];

const STATUS_TONE: Record<OrderStatus, Tone> = {
  placed: "rust",
  confirmed: "teal",
  processing: "teal",
  shipped: "teal",
  delivered: "green",
  cancelled: "neutral",
};

// "refunded" is intentionally excluded — it only happens via the Refund action below,
// never by hand-picking a dropdown value that wouldn't actually touch Stripe.
const PAYMENT_STATUSES: PaymentStatus[] = ["pending", "paid", "failed"];

const PAYMENT_STATUS_TONE: Record<PaymentStatus, Tone> = {
  pending: "rust",
  paid: "green",
  failed: "red",
  refunded: "neutral",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackingDrafts, setTrackingDrafts] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    const { data } = await axiosInstance.get<ApiListResponse<Order>>("/admin/orders");
    setOrders(data.data);
    setTrackingDrafts(Object.fromEntries(data.data.map((o) => [o._id, o.trackingNumber ?? ""])));
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

  const updatePaymentStatus = async (id: string, paymentStatus: PaymentStatus) => {
    await axiosInstance.patch(`/admin/orders/${id}`, { paymentStatus });
    load();
  };

  const refund = async (id: string) => {
    await axiosInstance.post(`/admin/orders/${id}/refund`);
    load();
  };

  const saveTracking = async (id: string) => {
    await axiosInstance.patch(`/admin/orders/${id}`, { trackingNumber: trackingDrafts[id] ?? "" });
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
            <th className={tableCellClass}>Tracking</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-patch-line">
          {loading ? (
            <tr>
              <td colSpan={7}>
                <div className="animate-pulse space-y-3 p-6">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-14 rounded-lg bg-patch-ink/5" />
                  ))}
                </div>
              </td>
            </tr>
          ) : orders.length === 0 ? (
            <tr>
              <td colSpan={7}>
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
                <td className={tableCellClass}>
                  <p className="mb-1.5 text-xs capitalize text-patch-ink-muted">{order.paymentMethod}</p>
                  {order.paymentStatus === "refunded" ? (
                    <Badge tone={PAYMENT_STATUS_TONE.refunded}>Refunded</Badge>
                  ) : (
                    <div className="flex items-center gap-2">
                      <StatusPillSelect
                        value={order.paymentStatus}
                        tone={PAYMENT_STATUS_TONE[order.paymentStatus]}
                        options={PAYMENT_STATUSES}
                        onChange={(v) => updatePaymentStatus(order._id, v as PaymentStatus)}
                      />
                      {order.paymentStatus === "paid" && (
                        <Button variant="outline" className="px-3 py-1.5 text-xs" onClick={() => refund(order._id)}>
                          Refund
                        </Button>
                      )}
                    </div>
                  )}
                </td>
                <td className={tableCellClass}>
                  <StatusPillSelect
                    value={order.status}
                    tone={STATUS_TONE[order.status]}
                    options={STATUSES}
                    onChange={(v) => updateStatus(order._id, v as OrderStatus)}
                  />
                </td>
                <td className={tableCellClass}>
                  <div className="flex items-center gap-1.5">
                    <input
                      value={trackingDrafts[order._id] ?? ""}
                      onChange={(e) => setTrackingDrafts({ ...trackingDrafts, [order._id]: e.target.value })}
                      placeholder="Tracking #"
                      className="w-28 rounded-lg border border-patch-line bg-transparent px-2.5 py-1.5 text-xs outline-none focus:border-patch-ink"
                    />
                    <Button
                      variant="ghost"
                      icon={Truck}
                      className="px-2 py-1.5 text-xs"
                      onClick={() => saveTracking(order._id)}
                      disabled={(trackingDrafts[order._id] ?? "") === (order.trackingNumber ?? "")}
                    >
                      Save
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </TableCard>
    </div>
  );
}

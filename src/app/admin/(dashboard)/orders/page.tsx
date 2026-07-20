"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Eye, ShoppingCart, Undo2 } from "lucide-react";
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

const PAYMENT_STATUSES: PaymentStatus[] = ["pending", "paid", "failed", "refunded"];

const PAYMENT_STATUS_TONE: Record<PaymentStatus, Tone> = {
  pending: "rust",
  paid: "green",
  failed: "red",
  refunded: "neutral",
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

  const updatePaymentStatus = async (id: string, paymentStatus: PaymentStatus) => {
    await axiosInstance.patch(`/admin/orders/${id}`, { paymentStatus });
    load();
  };

  const saveTracking = async (id: string, tracking: { carrier: string; trackingNumber: string }) => {
    await axiosInstance.patch(`/admin/orders/${id}`, tracking);
    load();
  };

  const refundOrder = async (order: Order) => {
    if (!window.confirm(`Refund order ${order.orderNumber} (${formatPrice(order.total, order.currency)})?`)) return;
    try {
      await axiosInstance.post(`/admin/orders/${order._id}/refund`);
    } catch (err) {
      window.alert(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Refund failed."
      );
    }
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
            <th className={tableCellClass}></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-patch-line">
          {loading ? (
            <tr>
              <td colSpan={8}>
                <div className="animate-pulse space-y-3 p-6">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-14 rounded-lg bg-patch-ink/5" />
                  ))}
                </div>
              </td>
            </tr>
          ) : orders.length === 0 ? (
            <tr>
              <td colSpan={8}>
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
                  <StatusPillSelect
                    value={order.paymentStatus}
                    tone={PAYMENT_STATUS_TONE[order.paymentStatus]}
                    options={PAYMENT_STATUSES}
                    onChange={(v) => updatePaymentStatus(order._id, v as PaymentStatus)}
                  />
                  {order.paymentStatus === "paid" && (
                    <button
                      onClick={() => refundOrder(order)}
                      className="mt-1.5 flex items-center gap-1 text-xs text-patch-ink-muted underline underline-offset-4 hover:text-patch-ink"
                    >
                      <Undo2 size={12} /> Refund
                    </button>
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
                  <TrackingCell order={order} onSave={saveTracking} />
                </td>
                <td className={`${tableCellClass} text-right`}>
                  <Link
                    href={`/admin/orders/${order._id}`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-patch-ink-muted transition hover:bg-patch-ink/5 hover:text-patch-ink"
                    title="View order"
                    aria-label={`View order ${order.orderNumber}`}
                  >
                    <Eye size={16} />
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </TableCard>
    </div>
  );
}

function TrackingCell({
  order,
  onSave,
}: {
  order: Order;
  onSave: (id: string, tracking: { carrier: string; trackingNumber: string }) => Promise<void>;
}) {
  const [carrier, setCarrier] = useState(order.carrier ?? "");
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber ?? "");

  const dirty = carrier !== (order.carrier ?? "") || trackingNumber !== (order.trackingNumber ?? "");

  const inputClass =
    "w-32 rounded-lg border border-patch-line bg-transparent px-2.5 py-1.5 text-xs text-patch-ink outline-none placeholder:text-patch-ink-muted/60 focus:border-patch-ink";

  return (
    <div className="space-y-1.5">
      <input
        value={carrier}
        onChange={(e) => setCarrier(e.target.value)}
        placeholder="Carrier"
        className={inputClass}
      />
      <input
        value={trackingNumber}
        onChange={(e) => setTrackingNumber(e.target.value)}
        placeholder="Tracking #"
        className={inputClass}
      />
      {dirty && (
        <button
          onClick={() => onSave(order._id, { carrier, trackingNumber })}
          className="block text-xs font-medium text-patch-ink underline underline-offset-4"
        >
          Save
        </button>
      )}
    </div>
  );
}

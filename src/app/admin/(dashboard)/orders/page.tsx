"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock, Eye, ShoppingCart, Undo2, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import axiosInstance from "@/lib/axios";
import { cn, formatPrice } from "@/lib/utils";
import {
  daysLate,
  isOrderTab,
  OVERDUE_AFTER_DAYS,
  type OrderTab,
  type OrderTabCounts,
} from "@/lib/order-buckets";
import OrderTabBar, { orderTabPanelId } from "@/components/admin/OrderTabBar";
import {
  Badge,
  Card,
  EmptyState,
  PageHeader,
  StatusPillSelect,
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

const ZERO_COUNTS: OrderTabCounts = { pending: 0, overdue: 0, completed: 0, cancelled: 0 };

type OrdersResponse = ApiListResponse<Order> & { tabCounts?: OrderTabCounts };

const EMPTY_STATES: Record<OrderTab, { icon: LucideIcon; title: string; description: string }> = {
  pending: {
    icon: CheckCircle2,
    title: "Nothing waiting",
    description: "Every order has been delivered or cancelled. No fulfillment work is open.",
  },
  overdue: {
    icon: CheckCircle2,
    title: "Nothing overdue",
    description: `Every paid order is inside the ${OVERDUE_AFTER_DAYS}-day window.`,
  },
  completed: {
    icon: ShoppingCart,
    title: "No delivered orders yet",
    description: "Orders land here once they are marked delivered.",
  },
  cancelled: {
    icon: XCircle,
    title: "No cancelled orders",
    description: "Cancelled orders are kept here for reference.",
  },
};

// Relative for scanning, absolute on hover for the record.
function relativeDay(value: string, now: Date) {
  const then = new Date(value);
  const elapsedDays = Math.floor((now.getTime() - then.getTime()) / (24 * 60 * 60 * 1000));
  if (elapsedDays <= 0) return "today";
  if (elapsedDays === 1) return "yesterday";
  return `${elapsedDays}d ago`;
}

function absoluteDay(value: string) {
  return new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

function lateLabel(late: number) {
  if (late <= 0) return "just overdue";
  return late === 1 ? "1 day late" : `${late} days late`;
}

type Column = {
  key: string;
  label: string;
  /** Skeleton width, so loading rows hold the real shape of the table. */
  skeleton: string;
  align?: "right";
  render: (order: Order) => React.ReactNode;
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get("tab");
  const [tab, setTab] = useState<OrderTab>(tabParam && isOrderTab(tabParam) ? tabParam : "pending");
  const [orders, setOrders] = useState<Order[]>([]);
  const [counts, setCounts] = useState<OrderTabCounts>(ZERO_COUNTS);
  const [loading, setLoading] = useState(true);
  // Pinned when the rows land so "5d ago" and the late badges agree with the
  // server's bucketing instead of drifting on every re-render.
  const [now, setNow] = useState(() => new Date());

  const load = useCallback(async (nextTab: OrderTab) => {
    setLoading(true);
    const { data } = await axiosInstance.get<OrdersResponse>(`/admin/orders?tab=${nextTab}`);
    setOrders(data.data);
    setCounts(data.tabCounts ?? ZERO_COUNTS);
    setNow(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    router.replace(`/admin/orders?tab=${tab}`, { scroll: false });
    // eslint-disable-next-line react-hooks/set-state-in-effect -- tab changes intentionally trigger a remote list refresh
    load(tab);
  }, [load, router, tab]);

  // Row mutations can move a row out of the active tab (shipping an overdue order
  // drops it into Pending). Rows and counts come from the same response, so one
  // refetch keeps the badges and the table from ever disagreeing.
  const refresh = useCallback(() => load(tab), [load, tab]);

  const updateStatus = async (id: string, status: OrderStatus) => {
    await axiosInstance.patch(`/admin/orders/${id}`, { status });
    refresh();
  };

  const updatePaymentStatus = async (id: string, paymentStatus: PaymentStatus) => {
    await axiosInstance.patch(`/admin/orders/${id}`, { paymentStatus });
    refresh();
  };

  const saveTracking = async (id: string, tracking: { carrier: string; trackingNumber: string }) => {
    await axiosInstance.patch(`/admin/orders/${id}`, tracking);
    refresh();
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
    refresh();
  };

  const columns = useMemo<Column[]>(() => {
    const orderColumn: Column = {
      key: "order",
      label: "Order #",
      skeleton: "w-24",
      render: (order) => <span className="font-medium text-patch-ink">{order.orderNumber}</span>,
    };

    const lateBy: Column = {
      key: "lateBy",
      label: "Late by",
      skeleton: "w-20",
      render: (order) => (
        <Badge tone="rust">{lateLabel(daysLate(order, now))}</Badge>
      ),
    };

    const dateColumn = (key: string, label: string, field: "createdAt" | "updatedAt"): Column => ({
      key,
      label,
      skeleton: "w-16",
      render: (order) => (
        <span className="text-patch-ink-muted" title={absoluteDay(order[field])}>
          {relativeDay(order[field], now)}
        </span>
      ),
    });

    const customer: Column = {
      key: "customer",
      label: "Customer",
      skeleton: "w-36",
      render: (order) => (
        <>
          <p className="text-patch-ink">{order.shippingAddress.fullName}</p>
          <p className="text-xs text-patch-ink-muted">
            {order.shippingAddress.phone} · {order.shippingAddress.city}
          </p>
        </>
      ),
    };

    const items: Column = {
      key: "items",
      label: "Items",
      skeleton: "w-8",
      render: (order) => <span className="text-patch-ink-muted">{order.items.length}</span>,
    };

    const total: Column = {
      key: "total",
      label: "Total",
      skeleton: "w-20",
      render: (order) => <span className="text-patch-ink">{formatPrice(order.total, order.currency)}</span>,
    };

    const payment: Column = {
      key: "payment",
      label: "Payment",
      skeleton: "w-24",
      render: (order) => (
        <>
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
        </>
      ),
    };

    const status: Column = {
      key: "status",
      label: "Status",
      skeleton: "w-24",
      render: (order) => (
        <StatusPillSelect
          value={order.status}
          tone={STATUS_TONE[order.status]}
          options={STATUSES}
          onChange={(v) => updateStatus(order._id, v as OrderStatus)}
        />
      ),
    };

    const tracking: Column = {
      key: "tracking",
      label: "Tracking",
      skeleton: "w-32",
      render: (order) => <TrackingCell order={order} onSave={saveTracking} />,
    };

    const actions: Column = {
      key: "actions",
      label: "",
      skeleton: "w-9",
      align: "right",
      render: (order) => (
        <Link
          href={`/admin/orders/${order._id}`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-patch-ink-muted transition hover:bg-patch-ink/5 hover:text-patch-ink"
          title="View order"
          aria-label={`View order ${order.orderNumber}`}
        >
          <Eye size={16} />
        </Link>
      ),
    };

    const placed = dateColumn("placed", "Placed", "createdAt");

    switch (tab) {
      case "overdue":
        return [orderColumn, lateBy, placed, customer, items, total, payment, status, tracking, actions];
      case "completed":
        return [
          orderColumn,
          dateColumn("closed", "Last update", "updatedAt"),
          customer,
          items,
          total,
          payment,
          status,
          actions,
        ];
      case "cancelled":
        return [
          orderColumn,
          dateColumn("closed", "Last update", "updatedAt"),
          customer,
          total,
          payment,
          status,
          actions,
        ];
      default:
        return [orderColumn, placed, customer, items, total, payment, status, tracking, actions];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handlers are stable for the lifetime of the page
  }, [tab, now]);

  const empty = EMPTY_STATES[tab];

  return (
    <div>
      <PageHeader icon={ShoppingCart} title="Orders" description="Track fulfillment from placed to delivered." />

      <OrderTabBar active={tab} counts={counts} loading={loading} onChange={setTab} />

      <div
        role="tabpanel"
        id={orderTabPanelId(tab)}
        aria-labelledby={`orders-tab-${tab}`}
        tabIndex={-1}
        className="outline-none"
      >
        {/* Desktop: a real table, scrolled inside the card with a sticky header. */}
        <Card className="mt-4 hidden overflow-hidden sm:block">
          <div className="max-h-[calc(100vh-19rem)] overflow-auto">
            <table className="w-full text-[15px]">
              <thead className={cn(tableHeadClass, "sticky top-0 z-10 bg-patch-bg-alt")}>
                <tr>
                  {columns.map((column) => (
                    <th key={column.key} className={cn(tableCellClass, column.align === "right" && "text-right")}>
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-patch-line">
                {loading ? (
                  [0, 1, 2, 3].map((row) => (
                    <tr key={row} className="animate-pulse">
                      {columns.map((column) => (
                        <td key={column.key} className={tableCellClass}>
                          <div className={cn("h-4 rounded bg-patch-ink/5", column.skeleton)} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length}>
                      <EmptyState icon={empty.icon} title={empty.title} description={empty.description} />
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order._id} className={tableRowClass}>
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className={cn(tableCellClass, column.align === "right" && "text-right")}
                        >
                          {column.render(order)}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Mobile: stacked cards. Order triage happens away from a desk, and a
            nine-column table cannot be read on a phone. */}
        <div className="mt-4 space-y-3 sm:hidden">
          {loading ? (
            [0, 1, 2].map((row) => (
              <Card key={row} className="animate-pulse p-4">
                <div className="h-4 w-24 rounded bg-patch-ink/5" />
                <div className="mt-3 h-4 w-40 rounded bg-patch-ink/5" />
                <div className="mt-3 h-8 w-full rounded bg-patch-ink/5" />
              </Card>
            ))
          ) : orders.length === 0 ? (
            <Card>
              <EmptyState icon={empty.icon} title={empty.title} description={empty.description} />
            </Card>
          ) : (
            orders.map((order) => (
              <Card key={order._id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-patch-ink">{order.orderNumber}</p>
                    <p className="text-xs text-patch-ink-muted" title={absoluteDay(order.createdAt)}>
                      {relativeDay(order.createdAt, now)}
                    </p>
                  </div>
                  {tab === "overdue" && <Badge tone="rust">{lateLabel(daysLate(order, now))}</Badge>}
                </div>

                <div className="mt-3 border-t border-patch-line pt-3">
                  <p className="text-sm text-patch-ink">{order.shippingAddress.fullName}</p>
                  <p className="text-xs text-patch-ink-muted">
                    {order.shippingAddress.phone} · {order.shippingAddress.city}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-patch-ink-muted">
                    {order.items.length} {order.items.length === 1 ? "item" : "items"}
                  </span>
                  <span className="font-medium text-patch-ink">{formatPrice(order.total, order.currency)}</span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <StatusPillSelect
                    value={order.status}
                    tone={STATUS_TONE[order.status]}
                    options={STATUSES}
                    onChange={(v) => updateStatus(order._id, v as OrderStatus)}
                  />
                  <StatusPillSelect
                    value={order.paymentStatus}
                    tone={PAYMENT_STATUS_TONE[order.paymentStatus]}
                    options={PAYMENT_STATUSES}
                    onChange={(v) => updatePaymentStatus(order._id, v as PaymentStatus)}
                  />
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 border-t border-patch-line pt-3">
                  {order.paymentStatus === "paid" ? (
                    <button
                      onClick={() => refundOrder(order)}
                      className="flex items-center gap-1 text-xs text-patch-ink-muted underline underline-offset-4 hover:text-patch-ink"
                    >
                      <Undo2 size={12} /> Refund
                    </button>
                  ) : (
                    <span />
                  )}
                  <Link
                    href={`/admin/orders/${order._id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-patch-ink underline underline-offset-4"
                  >
                    <Eye size={14} /> View order
                  </Link>
                </div>

                {(tab === "pending" || tab === "overdue") && (
                  <div className="mt-3 border-t border-patch-line pt-3">
                    <TrackingCell order={order} onSave={saveTracking} />
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </div>

      {tab === "overdue" && !loading && orders.length > 0 && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-patch-ink-muted">
          <Clock size={12} />
          Paid but not yet shipped for more than {OVERDUE_AFTER_DAYS} days, oldest first.
        </p>
      )}
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
        aria-label={`Carrier for order ${order.orderNumber}`}
      />
      <input
        value={trackingNumber}
        onChange={(e) => setTrackingNumber(e.target.value)}
        placeholder="Tracking #"
        className={inputClass}
        aria-label={`Tracking number for order ${order.orderNumber}`}
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

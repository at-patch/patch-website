"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { CreditCard, PackageCheck, Save, ShoppingCart, Undo2 } from "lucide-react";
import axiosInstance from "@/lib/axios";
import { formatPrice } from "@/lib/utils";
import {
  Button,
  Card,
  ErrorBanner,
  FormInput,
  FormSection,
  PageHeader,
  StatusPillSelect,
  type Tone,
} from "@/components/admin/ui";
import { OrderInvoice } from "@/components/orders/OrderInvoice";
import type { ApiResponse, Order, OrderStatus, PaymentStatus } from "@/types";

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

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [carrier, setCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await axiosInstance.get<ApiResponse<Order>>(`/admin/orders/${params.id}`);
        setOrder(data.data);
        setCarrier(data.data.carrier ?? "");
        setTrackingNumber(data.data.trackingNumber ?? "");
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          router.push("/admin/login");
          return;
        }
        setError("Order not found.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [params.id, router]);

  const patchOrder = async (payload: Partial<Pick<Order, "status" | "paymentStatus" | "carrier" | "trackingNumber">>) => {
    if (!order) return;
    setError(null);
    try {
      const { data } = await axiosInstance.patch<ApiResponse<Order>>(`/admin/orders/${order._id}`, payload);
      setOrder(data.data);
      setCarrier(data.data.carrier ?? "");
      setTrackingNumber(data.data.trackingNumber ?? "");
    } catch (err) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to update order.");
    }
  };

  const refundOrder = async () => {
    if (!order) return;
    if (!window.confirm(`Refund order ${order.orderNumber} (${formatPrice(order.total, order.currency)})?`)) return;

    setError(null);
    try {
      const { data } = await axiosInstance.post<ApiResponse<Order>>(`/admin/orders/${order._id}/refund`);
      setOrder(data.data);
    } catch (err) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Refund failed.");
    }
  };

  if (loading) {
    return <div className="text-sm text-patch-ink-muted">Loading order...</div>;
  }

  if (!order) {
    return <ErrorBanner>{error ?? "Order not found."}</ErrorBanner>;
  }

  const trackingDirty = carrier !== (order.carrier ?? "") || trackingNumber !== (order.trackingNumber ?? "");

  return (
    <div>
      <PageHeader
        icon={ShoppingCart}
        title={order.orderNumber}
        description="Review, fulfill, refund, and print the complete order invoice."
        action={<Button variant="outline" onClick={() => router.push("/admin/orders")}>Back to orders</Button>}
      />

      {error && <div className="mt-4"><ErrorBanner>{error}</ErrorBanner></div>}

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <FormSection title="Fulfillment">
            <div>
              <p className="mb-1.5 text-xs font-medium text-patch-ink-muted">Order status</p>
              <StatusPillSelect
                value={order.status}
                tone={STATUS_TONE[order.status]}
                options={STATUSES}
                onChange={(value) => patchOrder({ status: value as OrderStatus })}
              />
            </div>
            <FormInput icon={PackageCheck} label="Carrier" value={carrier} onChange={setCarrier} />
            <FormInput icon={PackageCheck} label="Tracking number" value={trackingNumber} onChange={setTrackingNumber} />
            <div className="flex items-end">
              <Button
                type="button"
                icon={Save}
                disabled={!trackingDirty}
                onClick={() => patchOrder({ carrier, trackingNumber })}
              >
                Save tracking
              </Button>
            </div>
          </FormSection>
        </Card>

        <Card className="p-5">
          <FormSection title="Payment">
            <div>
              <p className="mb-1.5 text-xs font-medium text-patch-ink-muted">Payment status</p>
              <StatusPillSelect
                value={order.paymentStatus}
                tone={PAYMENT_STATUS_TONE[order.paymentStatus]}
                options={PAYMENT_STATUSES}
                onChange={(value) => patchOrder({ paymentStatus: value as PaymentStatus })}
              />
            </div>
            <div className="rounded-xl border border-patch-line px-3.5 py-2.5 text-sm text-patch-ink">
              <div className="flex items-center gap-2 capitalize">
                <CreditCard size={15} className="text-patch-ink-muted" />
                {order.paymentMethod}
              </div>
              <p className="mt-1 text-xs text-patch-ink-muted">{formatPrice(order.total, order.currency)}</p>
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                icon={Undo2}
                onClick={refundOrder}
                disabled={order.paymentStatus !== "paid"}
              >
                Refund
              </Button>
            </div>
          </FormSection>
        </Card>
      </div>

      <OrderInvoice order={order} />
    </div>
  );
}

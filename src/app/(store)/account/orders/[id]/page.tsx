"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import axiosInstance from "@/lib/axios";
import { OrderInvoice } from "@/components/orders/OrderInvoice";
import type { ApiResponse, Order } from "@/types";

export default function AccountOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const { data } = await axiosInstance.get<ApiResponse<Order>>(`/account/orders/${params.id}`);
        if (!cancelled) setOrder(data.data);
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          router.push("/account/login");
          return;
        }
        if (!cancelled) setNotFound(true);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [params.id, router]);

  if (notFound) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-sm text-patch-ink-muted">
        We could not find that order under your account.
      </div>
    );
  }

  if (!order) {
    return <div className="mx-auto max-w-3xl px-6 py-24 text-sm text-patch-ink-muted">Loading order...</div>;
  }

  return <OrderInvoice order={order} backHref="/account" backLabel="Back to account" />;
}

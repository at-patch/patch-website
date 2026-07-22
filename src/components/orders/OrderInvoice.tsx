import Link from "next/link";
import Image from "next/image";
import { formatPrice, isValidImageSrc } from "@/lib/utils";
import type { Order } from "@/types";
import { PrintInvoiceButton } from "@/components/orders/PrintInvoiceButton";

function label(value: string) {
  return value.replaceAll("-", " ");
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function OrderInvoice({
  order,
  backHref,
  backLabel,
}: {
  order: Order;
  backHref?: string;
  backLabel?: string;
}) {
  const shipping = order.shippingAddress;

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 print:max-w-none print:px-0 print:py-0">
      <div className="print:hidden mb-6 flex flex-wrap items-center justify-between gap-3">
        {backHref && backLabel ? (
          <Link href={backHref} className="text-sm font-medium text-patch-ink underline underline-offset-4">
            {backLabel}
          </Link>
        ) : (
          <span />
        )}
        <PrintInvoiceButton />
      </div>

      <section className="rounded-2xl border border-patch-line bg-patch-bg p-6 shadow-[0_1px_2px_rgba(19,19,16,0.04)] print:border-0 print:p-0 print:shadow-none">
        <div className="flex flex-col gap-6 border-b border-patch-line pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-heading text-2xl font-extrabold tracking-tight text-patch-ink">PATCH</p>
            <p className="mt-1 text-sm text-patch-ink-muted">Order invoice and fulfillment details</p>
          </div>
          <div className="text-left sm:text-right">
            <h1 className="font-heading text-xl font-semibold tracking-tight text-patch-ink">Invoice</h1>
            <p className="mt-1 font-mono text-sm text-patch-ink">{order.orderNumber}</p>
            <p className="mt-1 text-xs text-patch-ink-muted">{formatDate(order.createdAt)}</p>
          </div>
        </div>

        <div className="grid gap-5 border-b border-patch-line py-6 sm:grid-cols-3">
          <InfoBlock title="Customer">
            <p>{shipping.fullName}</p>
            <p>{shipping.email}</p>
            <p>{shipping.phone}</p>
          </InfoBlock>
          <InfoBlock title="Shipping address">
            <p>{shipping.addressLine}</p>
            <p>{shipping.city}</p>
            {shipping.notes && <p>Notes: {shipping.notes}</p>}
          </InfoBlock>
          <InfoBlock title="Order status">
            <p className="capitalize">Fulfillment: {label(order.status)}</p>
            <p className="capitalize">Payment: {label(order.paymentStatus)}</p>
            <p className="capitalize">Method: {label(order.paymentMethod)}</p>
            {order.trackingNumber && (
              <p>
                Tracking: {order.carrier ? `${order.carrier} ` : ""}
                {order.trackingNumber}
              </p>
            )}
          </InfoBlock>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-patch-line text-xs uppercase tracking-wide text-patch-ink-muted">
              <tr>
                <th className="py-4 pr-4">Item</th>
                <th className="py-4 pr-4">SKU</th>
                <th className="py-4 pr-4">Size</th>
                <th className="py-4 pr-4">Color</th>
                <th className="py-4 text-right">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-patch-line">
              {order.items.map((item, index) => {
                const image = isValidImageSrc(item.image) ? item.image : null;

                return (
                  <tr key={`${item.product}-${item.sku}-${index}`}>
                    <td className="py-4 pr-4 font-medium text-patch-ink">
                      <div className="flex min-w-64 items-center gap-3">
                        <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg border border-patch-line bg-patch-bg-alt">
                          {image ? (
                            <Image src={image} alt={item.name} fill sizes="48px" className="object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center px-1 text-center text-[10px] leading-tight text-patch-ink-muted">
                              No image
                            </div>
                          )}
                        </div>
                        <span>{item.name}</span>
                      </div>
                    </td>
                    <td className="py-4 pr-4 font-mono text-xs text-patch-ink-muted">{item.sku}</td>
                    <td className="py-4 pr-4 text-patch-ink-muted">{item.size}</td>
                    <td className="py-4 pr-4 text-patch-ink-muted">{item.color || "-"}</td>
                    <td className="py-4 text-right text-patch-ink">{formatPrice(item.price, order.currency)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="ml-auto mt-6 w-full max-w-sm space-y-3 text-sm">
          <TotalRow label="Subtotal" value={formatPrice(order.subtotal, order.currency)} />
          <TotalRow label="Shipping" value={formatPrice(order.shippingCost ?? shipping.shippingCost ?? 0, order.currency)} />
          {order.discount ? (
            <TotalRow
              label={order.couponCode ? `Discount (${order.couponCode})` : "Discount"}
              value={`-${formatPrice(order.discount, order.currency)}`}
            />
          ) : null}
          <div className="border-t border-patch-line pt-3">
            <TotalRow label="Total" value={formatPrice(order.total, order.currency)} strong />
          </div>
        </div>
      </section>
    </div>
  );
}

function InfoBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-patch-ink-muted">{title}</p>
      <div className="space-y-1 text-sm leading-6 text-patch-ink">{children}</div>
    </div>
  );
}

function TotalRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-4 ${strong ? "text-base font-semibold text-patch-ink" : "text-patch-ink-muted"}`}>
      <span>{label}</span>
      <span className="text-patch-ink">{value}</span>
    </div>
  );
}

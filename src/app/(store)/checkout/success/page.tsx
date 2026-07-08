import Link from "next/link";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;

  return (
    <div className="mx-auto max-w-lg px-6 py-24 text-center">
      <h1 className="font-heading text-2xl font-extrabold tracking-tight text-patch-ink">Order placed</h1>
      <p className="mt-3 text-sm text-patch-ink-muted">
        Thank you — we&apos;ve received your order{order ? ` ${order}` : ""}. The Patch team will
        confirm payment and reach out with shipping details shortly.
      </p>
      <Link
        href="/shop"
        className="mt-8 inline-block rounded-full bg-patch-ink px-6 py-3 text-sm font-medium text-patch-bg hover:opacity-90"
      >
        Continue shopping
      </Link>
    </div>
  );
}

import { VerifyEmailStatus } from "@/components/store/VerifyEmailStatus";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="mx-auto max-w-sm px-6 py-24">
      <h1 className="font-heading text-2xl font-extrabold tracking-tight text-patch-ink">Verify Email</h1>
      <VerifyEmailStatus token={token ?? ""} />
    </div>
  );
}

import { ResetPasswordForm } from "@/components/store/ResetPasswordForm";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="mx-auto max-w-sm px-6 py-24">
      <h1 className="font-heading text-2xl font-extrabold tracking-tight text-patch-ink">Set a New Password</h1>
      <ResetPasswordForm token={token ?? ""} />
    </div>
  );
}

import { Sidebar } from "@/components/admin/Sidebar";

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-patch-bg">
      <Sidebar />
      <main className="flex-1 overflow-x-auto p-6 sm:p-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}

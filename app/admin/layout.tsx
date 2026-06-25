import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <main className="grid min-h-screen lg:grid-cols-[260px_1fr]">
      <AdminSidebar />
      <section className="min-w-0 px-4 py-8 sm:px-6 lg:px-8">{children}</section>
    </main>
  );
}

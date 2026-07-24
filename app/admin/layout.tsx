import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminGlobalSearch } from "@/components/admin/admin-global-search";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <main className="grid min-h-screen grid-cols-[minmax(0,1fr)] lg:grid-cols-[260px_minmax(0,1fr)]">
      <AdminSidebar />
      <section className="min-w-0 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 max-w-2xl">
          <AdminGlobalSearch />
        </div>
        {children}
      </section>
    </main>
  );
}

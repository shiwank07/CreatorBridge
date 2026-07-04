import { ContactTable } from "@/components/admin/contact-table";
import { EmptyState } from "@/components/shared/empty-state";
import { getAdminContactDetails } from "@/lib/queries/admin";

export const dynamic = "force-dynamic";

export default async function AdminContactsPage() {
  const contacts = await getAdminContactDetails();

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase text-violet-300">Contact Admin</p>
        <h1 className="mt-3 font-display text-4xl font-black">Creator and brand contacts</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
          Admin-only contact details for trust, support, and urgent follow-up. Phone numbers must not be shared with users.
        </p>
      </div>

      {contacts.length > 0 ? (
        <ContactTable contacts={contacts} />
      ) : (
        <EmptyState
          title="No contacts yet"
          description="Creator and brand contact details appear here after onboarding."
          actionHref="/admin"
          actionLabel="Back to Admin"
        />
      )}
    </div>
  );
}

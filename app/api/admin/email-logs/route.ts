import { NextResponse } from "next/server";

import { handleRouteError, parseJsonBody } from "@/lib/api-errors";
import { getAdminState } from "@/lib/admin";
import { connectDB, hasMongoUri } from "@/lib/db";
import { sendContactAdminAlert, sendContactConfirmation } from "@/lib/email/core-email-service";
import { absoluteAppUrl, readEmailEnvironment } from "@/lib/email/email-config";
import { ContactMessage } from "@/lib/models/ContactMessage";
import { EmailNotification } from "@/lib/models/EmailNotification";
import { getAdminEmailLogsPage } from "@/lib/queries/admin";
import { emailLogRetrySchema } from "@/lib/validators/admin";

export async function GET(req: Request) {
  const admin = await getAdminState();
  if (!admin.isAdmin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const url = new URL(req.url);
  return NextResponse.json(await getAdminEmailLogsPage({
    page: Number(url.searchParams.get("page") ?? 1),
    limit: Number(url.searchParams.get("limit") ?? 30),
    status: url.searchParams.get("status") ?? undefined,
    event: url.searchParams.get("event") ?? undefined,
    search: url.searchParams.get("search") ?? undefined,
    sort: url.searchParams.get("sort") ?? undefined,
    retryable: url.searchParams.get("retryable") ?? undefined,
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
  }));
}

export async function PATCH(req: Request) {
  try {
    const admin = await getAdminState();
    if (!admin.isAdmin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

    if (!hasMongoUri()) {
      return NextResponse.json({ error: "MongoDB is not configured yet." }, { status: 503 });
    }

    const body = await parseJsonBody(req);
    const parsed = emailLogRetrySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid email log update." }, { status: 400 });
    }

    await connectDB();
    const log = await EmailNotification.findById(parsed.data.id);
    if (!log) return NextResponse.json({ error: "Email log not found." }, { status: 404 });
    if (log.status !== "failed" || !log.retryable || !log.deliveryKey) {
      return NextResponse.json({ error: "This delivery is not eligible for automatic retry." }, { status: 400 });
    }

    try {
      const contactId = log.deliveryKey.split(":").at(-1);
      const contact = contactId ? await ContactMessage.findById(contactId) : null;
      if (!contact) return NextResponse.json({ error: "The source contact record is unavailable." }, { status: 409 });
      const config = readEmailEnvironment();
      const result = log.deliveryKey.startsWith("contact:confirmation:")
        ? await sendContactConfirmation({
          to: contact.email, eventId: contact._id.toString(), firstName: contact.name.split(/\s+/)[0],
          websiteUrl: absoluteAppUrl("/", config.appUrl), retryFailed: true,
        })
        : await sendContactAdminAlert({
          to: log.recipient, eventId: contact._id.toString(), senderName: contact.name, senderEmail: contact.email,
          category: contact.topic, messagePreview: contact.message.slice(0, 320),
          contactUrl: absoluteAppUrl(`/admin/contacts?search=${encodeURIComponent(contact.email)}`, config.appUrl),
          retryFailed: true,
        });
      return NextResponse.json({ ok: result.status === "sent", status: result.status, error: result.error });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Email retry failed.";
      log.status = "failed";
      log.error = message;
      await log.save();
      return NextResponse.json({ ok: false, error: message }, { status: 502 });
    }
  } catch (error) {
    return handleRouteError(error, "Admin email retry failed", "Could not retry email.");
  }
}

import { NextResponse } from "next/server";

import { handleRouteError, parseJsonBody } from "@/lib/api-errors";
import { connectDB, hasMongoUri } from "@/lib/db";
import { sendContactAdminAlert, sendContactConfirmation } from "@/lib/email/core-email-service";
import { absoluteAppUrl, readEmailEnvironment } from "@/lib/email/email-config";
import { ContactMessage } from "@/lib/models/ContactMessage";
import { acceptsContactContentType, contactRequestTooLarge, contactSubmissionSchema } from "@/lib/contact-security";

export async function POST(request: Request) {
  try {
    if (!acceptsContactContentType(request.headers.get("content-type"))) {
      return NextResponse.json({ error: "Invalid request." }, { status: 415 });
    }
    if (contactRequestTooLarge(request.headers.get("content-length"))) return NextResponse.json({ error: "Invalid request." }, { status: 413 });
    if (!hasMongoUri()) return NextResponse.json({ error: "Contact service is not configured." }, { status: 503 });
    const parsed = contactSubmissionSchema.safeParse(await parseJsonBody(request));
    if (!parsed.success) return NextResponse.json({ error: "Please check the submitted fields." }, { status: 400 });
    await connectDB();
    const normalizedEmail = parsed.data.email.toLowerCase();
    const recentWindow = new Date(Date.now() - 15 * 60_000);
    const duplicateWindow = new Date(Date.now() - 10 * 60_000);
    const [recentCount, duplicate] = await Promise.all([
      ContactMessage.countDocuments({ email: normalizedEmail, createdAt: { $gte: recentWindow } }),
      ContactMessage.exists({
        email: normalizedEmail, subject: parsed.data.subject, message: parsed.data.message,
        createdAt: { $gte: duplicateWindow },
      }),
    ]);
    if (recentCount >= 5) return NextResponse.json({ error: "Please wait before submitting another message." }, { status: 429 });
    if (duplicate) return NextResponse.json({ ok: true }, { status: 202 });
    const contact = await ContactMessage.create({
      name: parsed.data.name, email: parsed.data.email, topic: parsed.data.topic,
      subject: parsed.data.subject, message: parsed.data.message,
    });
    const config = readEmailEnvironment();
    const adminRecipient = process.env.ADMIN_NOTIFICATION_EMAIL?.trim().toLowerCase();
    const deliveries = [
      sendContactConfirmation({
        to: contact.email, eventId: contact._id.toString(), firstName: contact.name.split(/\s+/)[0],
        websiteUrl: absoluteAppUrl("/", config.appUrl),
      }),
      ...(adminRecipient ? [sendContactAdminAlert({
        to: adminRecipient, eventId: contact._id.toString(), senderName: contact.name,
        senderEmail: contact.email, category: contact.topic,
        messagePreview: contact.message.slice(0, 320),
        contactUrl: absoluteAppUrl(`/admin/contacts?search=${encodeURIComponent(contact.email)}`, config.appUrl),
      })] : []),
    ];
    await Promise.allSettled(deliveries);
    return NextResponse.json({ ok: true, id: contact._id.toString() }, { status: 201 });
  } catch (error) {
    return handleRouteError(error, "Contact submission failed", "Could not send your message.");
  }
}

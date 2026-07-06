import { createElement } from "react";
import { NextResponse } from "next/server";

import { handleRouteError, parseJsonBody } from "@/lib/api-errors";
import { getAdminState } from "@/lib/admin";
import { connectDB, hasMongoUri } from "@/lib/db";
import { sendEmail } from "@/lib/email/email-service";
import { EmailNotification } from "@/lib/models/EmailNotification";
import { getAdminEmailLogs } from "@/lib/queries/admin";
import { emailLogRetrySchema } from "@/lib/validators/admin";

export async function GET() {
  const admin = await getAdminState();
  if (!admin.isAdmin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const logs = await getAdminEmailLogs();
  return NextResponse.json({ logs });
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
    if (log.status !== "failed") return NextResponse.json({ error: "Only failed emails can be retried." }, { status: 400 });

    try {
      const result = await sendEmail({
        to: log.recipient,
        subject: "Branzzo notification retry",
        react: createElement(
          "div",
          null,
          createElement("p", null, "A Branzzo notification was retried by the admin team."),
          createElement("p", null, `Event: ${log.event}`),
        ),
      });

      log.status = result.status;
      log.providerId = result.providerId;
      log.error = result.error;
      await log.save();

      return NextResponse.json({ ok: true, status: log.status, error: log.error });
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

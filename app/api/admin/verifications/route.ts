import { NextResponse } from "next/server";
import { z } from "zod";
import type { PipelineStage } from "mongoose";

import { getAdminState } from "@/lib/admin";
import { handleRouteError, parseJsonBody } from "@/lib/api-errors";
import { connectDB, hasMongoUri } from "@/lib/db";
import { CreatorProfile } from "@/lib/models/CreatorProfile";
import { CreatorVerificationRequest } from "@/lib/models/CreatorVerificationRequest";
import { User } from "@/lib/models/User";
import { notificationService } from "@/lib/notifications/notification-service";
import { isVerificationCode } from "@/lib/verification-code";

const listSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]).default("pending"),
  q: z.string().trim().max(100).default(""),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(30),
});

const updateSchema = z.object({
  requestId: z.string().min(1),
  action: z.enum(["approve", "reject"]),
  note: z.string().trim().max(500).default(""),
}).refine((value) => value.action !== "reject" || value.note.length >= 2, {
  message: "Add a rejection reason.",
  path: ["note"],
});

type AggregatedVerification = {
  _id: { toString(): string };
  user: { name: string; username: string; email: string };
  platform: string;
  customPlatformName?: string;
  profileUrl: string;
  verificationCode: string;
  creatorNote?: string;
  status: string;
  adminNote?: string;
  submittedAt?: Date;
  reviewedAt?: Date | null;
};

export async function GET(req: Request) {
  try {
    const admin = await getAdminState();
    if (!admin.userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    if (!admin.isAdmin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    if (!hasMongoUri()) return NextResponse.json({ error: "MongoDB is not configured yet." }, { status: 503 });

    const url = new URL(req.url);
    const parsed = listSchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

    await connectDB();
    const { status, q, page, pageSize } = parsed.data;
    const search = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pipeline: PipelineStage[] = [
      { $match: { status } },
      { $lookup: { from: "creatorprofiles", localField: "creatorId", foreignField: "_id", as: "creator" } },
      { $unwind: "$creator" },
      { $lookup: { from: "users", localField: "creator.userId", foreignField: "_id", as: "user" } },
      { $unwind: "$user" },
    ];
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { "user.name": { $regex: search, $options: "i" } },
            { "user.username": { $regex: search, $options: "i" } },
            { "user.email": { $regex: search, $options: "i" } },
            { platform: { $regex: search, $options: "i" } },
            { customPlatformName: { $regex: search, $options: "i" } },
          ],
        },
      });
    }
    pipeline.push(
      { $sort: { submittedAt: -1 } },
      {
        $facet: {
          rows: [{ $skip: (page - 1) * pageSize }, { $limit: pageSize }],
          count: [{ $count: "value" }],
        },
      },
    );
    const [result] = await CreatorVerificationRequest.aggregate(pipeline);
    const rows = ((result?.rows ?? []) as AggregatedVerification[]).map((row) => ({
      id: String(row._id),
      name: row.user.name,
      username: row.user.username,
      email: row.user.email,
      platform: row.platform,
      customPlatformName: row.customPlatformName,
      profileUrl: row.profileUrl,
      verificationCode: row.verificationCode,
      creatorNote: row.creatorNote,
      status: row.status,
      adminNote: row.adminNote,
      submittedAt: row.submittedAt?.toISOString?.() ?? row.submittedAt,
      reviewedAt: row.reviewedAt?.toISOString?.() ?? row.reviewedAt,
    }));
    return NextResponse.json({ rows, page, pageSize, total: result?.count?.[0]?.value ?? 0 });
  } catch (error) {
    return handleRouteError(error, "Admin verification list failed", "Could not load verifications.");
  }
}

export async function PATCH(req: Request) {
  try {
    const admin = await getAdminState();
    if (!admin.userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    if (!admin.isAdmin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    if (!hasMongoUri()) return NextResponse.json({ error: "MongoDB is not configured yet." }, { status: 503 });

    const parsed = updateSchema.safeParse(await parseJsonBody(req));
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

    await connectDB();
    const request = await CreatorVerificationRequest.findOne({ _id: parsed.data.requestId, status: "pending" });
    if (!request) return NextResponse.json({ error: "Pending verification request not found." }, { status: 404 });
    if (!isVerificationCode(request.verificationCode)) {
      return NextResponse.json({ error: "The request does not contain a valid Branzzo verification code." }, { status: 400 });
    }

    const profile = await CreatorProfile.findById(request.creatorId);
    if (!profile) return NextResponse.json({ error: "Creator profile not found." }, { status: 404 });
    const user = await User.findById(profile.userId);
    if (!user) return NextResponse.json({ error: "Creator account not found." }, { status: 404 });

    const now = new Date();
    const approved = parsed.data.action === "approve";
    const updated = await CreatorVerificationRequest.updateOne(
      { _id: request._id, status: "pending" },
      { $set: { status: approved ? "approved" : "rejected", adminNote: parsed.data.note, reviewedBy: admin.userId, reviewedAt: now } },
    );
    if (updated.modifiedCount !== 1) return NextResponse.json({ error: "This request was already reviewed." }, { status: 409 });

    await CreatorProfile.updateOne(
      { _id: profile._id },
      {
        $set: {
          verificationStatus: approved ? "verified" : "rejected",
          verificationNote: parsed.data.note,
          verificationRejectedReason: approved ? "" : parsed.data.note,
          verificationReviewedAt: now,
          verificationReviewedByAdminId: admin.userId,
          verifiedAt: approved ? now : null,
          lastVerifiedAt: approved ? now : profile.lastVerifiedAt,
        },
      },
    );
    await User.updateOne({ _id: user._id }, { $set: { isVerified: approved } });

    if (approved) {
      await notificationService.notifyVerificationApproved({ user, accountType: "creator", note: parsed.data.note, statusLabel: "Verified Creator", eventId: request._id.toString() });
    } else {
      await notificationService.notifyVerificationRejected({ user, accountType: "creator", note: parsed.data.note, eventId: request._id.toString() });
    }
    return NextResponse.json({ ok: true, status: approved ? "approved" : "rejected" });
  } catch (error) {
    return handleRouteError(error, "Admin verification update failed", "Could not update verification.");
  }
}

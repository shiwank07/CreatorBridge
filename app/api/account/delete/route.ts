import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { handleRouteError, parseJsonBody } from "@/lib/api-errors";
import { hasClerkKeys } from "@/lib/clerk-config";
import { connectDB, hasMongoUri } from "@/lib/db";
import { BrandInquiry } from "@/lib/models/BrandInquiry";
import { BrandProfile } from "@/lib/models/BrandProfile";
import { CreatorProfile } from "@/lib/models/CreatorProfile";
import { User } from "@/lib/models/User";

export async function POST(req: Request) {
  try {
    if (!hasClerkKeys()) return NextResponse.json({ error: "Authentication is not configured yet." }, { status: 503 });
    if (!hasMongoUri()) return NextResponse.json({ error: "MongoDB is not configured yet." }, { status: 503 });

    const body = await parseJsonBody(req);
    if (body.confirmation !== "DELETE") {
      return NextResponse.json({ error: "Type DELETE to confirm account deletion." }, { status: 400 });
    }

    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Sign in before deleting your account." }, { status: 401 });

    await connectDB();
    const user = await User.findOne({ clerkId: userId }).exec();
    const deletedAt = new Date();

    if (user) {
      const deletedEmail = `deleted-${user._id.toString()}@branzzo.local`;
      const deletedUsername = `deleted${user._id.toString()}`;

      await Promise.all([
        User.updateOne(
          { _id: user._id },
          {
            $set: {
              email: deletedEmail,
              username: deletedUsername,
              name: "Deleted account",
              avatar: "",
              phoneNumber: "",
              phoneVerified: false,
              phoneVerifiedAt: null,
              onboardingComplete: false,
              isFeatured: false,
              isVerified: false,
              accountStatus: "suspended",
              trustReviewStatus: "needs_review",
              trustReviewNote: `Account deleted by user on ${deletedAt.toISOString()}.`,
              lastTrustReviewedAt: deletedAt,
            },
          },
        ).exec(),
        CreatorProfile.updateOne(
          { userId: user._id },
          {
            $set: {
              bio: "",
              phoneNumber: "",
              phoneVerified: false,
              phoneVerifiedAt: null,
              verificationStatus: "unverified",
              statsVerificationStatus: "unverified",
              verificationCode: "",
              verificationProfileUrl: "",
              verificationSubmittedNote: "",
              verificationNote: "",
              verificationRejectedReason: "",
              sampleWorkUrls: [],
              pastBrands: [],
              isOpenToDeals: false,
              availabilityStatus: "closed",
              upiId: "",
              paypalEmail: "",
              bankAccountName: "",
              bankAccountNumber: "",
              ifsc: "",
              preferredPaymentNote: "",
            },
          },
        ).exec(),
        BrandProfile.updateOne(
          { userId: user._id },
          {
            $set: {
              companyName: "Deleted brand",
              contactName: "Deleted account",
              contactRole: "",
              contactEmail: deletedEmail,
              phoneNumber: "",
              phoneVerified: false,
              phoneVerifiedAt: null,
              website: "",
              notes: "",
              companyRegistrationText: "",
              verificationStatus: "unverified",
              verificationCode: "",
              verificationNote: "",
              rejectionReason: "",
            },
          },
        ).exec(),
        BrandInquiry.updateMany(
          { brandUserId: user._id },
          {
            $set: {
              contactName: "Deleted account",
              email: deletedEmail,
            },
          },
        ).exec(),
      ]);
    }

    const client = await clerkClient();
    await client.users.deleteUser(userId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error, "Account deletion failed", "Could not delete this account.");
  }
}

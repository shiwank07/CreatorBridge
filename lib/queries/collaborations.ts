import { auth } from "@clerk/nextjs/server";

import { normalizeCollaborationStatus, type BrandInquiryStatus, type CollaborationStatus } from "@/lib/collaborations";
import { connectDB, hasMongoUri } from "@/lib/db";
import { BrandInquiry } from "@/lib/models/BrandInquiry";
import { BrandProfile } from "@/lib/models/BrandProfile";
import { CreatorProfile } from "@/lib/models/CreatorProfile";
import { User } from "@/lib/models/User";
import { hasClerkKeys } from "@/lib/clerk-config";
import { type BrandInquiryData } from "@/lib/types";

type CollaborationDocument = {
  _id: { toString(): string };
  companyName: string;
  contactName: string;
  email: string;
  website?: string;
  campaignGoal: string;
  deliverables?: string[];
  targetNiches?: string[];
  targetPlatforms?: string[];
  budgetRange: string;
  timeline: string;
  message?: string;
  creatorUsername?: string;
  creatorResponseAt?: Date | null;
  creatorResponseNote?: string;
  status: BrandInquiryStatus;
  deliveryProof?: {
    videoUrl?: string;
    timestampStart?: string;
    timestampEnd?: string;
    notes?: string;
    screenshotUrl?: string;
    referenceLink?: string;
    submittedAt?: Date | null;
    reviewedAt?: Date | null;
    reviewNote?: string;
    issueNote?: string;
    issueReportedAt?: Date | null;
  };
  createdAt?: Date;
};

type DashboardUser = {
  id: string;
  username: string;
  name: string;
  role: string;
};

export type CollaborationDashboardData = {
  user: DashboardUser | null;
  collaborations: BrandInquiryData[];
};

function mapCollaboration(doc: CollaborationDocument): BrandInquiryData {
  return {
    id: doc._id.toString(),
    companyName: doc.companyName,
    contactName: doc.contactName,
    email: doc.email,
    website: doc.website,
    campaignGoal: doc.campaignGoal,
    deliverables: doc.deliverables ?? [],
    targetNiches: doc.targetNiches ?? [],
    targetPlatforms: doc.targetPlatforms ?? [],
    budgetRange: doc.budgetRange,
    timeline: doc.timeline,
    message: doc.message,
    creatorUsername: doc.creatorUsername,
    creatorResponseAt: doc.creatorResponseAt?.toISOString(),
    creatorResponseNote: doc.creatorResponseNote,
    status: normalizeCollaborationStatus(doc.status),
    deliveryProof: doc.deliveryProof
      ? {
          videoUrl: doc.deliveryProof.videoUrl,
          timestampStart: doc.deliveryProof.timestampStart,
          timestampEnd: doc.deliveryProof.timestampEnd,
          notes: doc.deliveryProof.notes,
          screenshotUrl: doc.deliveryProof.screenshotUrl,
          referenceLink: doc.deliveryProof.referenceLink,
          submittedAt: doc.deliveryProof.submittedAt?.toISOString(),
          reviewedAt: doc.deliveryProof.reviewedAt?.toISOString(),
          reviewNote: doc.deliveryProof.reviewNote,
          issueNote: doc.deliveryProof.issueNote,
          issueReportedAt: doc.deliveryProof.issueReportedAt?.toISOString(),
        }
      : undefined,
    createdAt: doc.createdAt?.toISOString(),
  };
}

async function getCurrentUserRecord() {
  if (!hasMongoUri() || !hasClerkKeys()) return null;

  const { userId } = await auth();
  if (!userId) return null;

  await connectDB();
  return User.findOne({ clerkId: userId }).exec();
}

export async function getCreatorCollaborationDashboard(): Promise<CollaborationDashboardData> {
  const user = await getCurrentUserRecord();
  if (!user) return { user: null, collaborations: [] };

  const creatorProfile = await CreatorProfile.findOne({ userId: user._id }).exec();
  const filters: Record<string, unknown>[] = [{ creatorUsername: user.username }];

  filters.push({ creatorUserId: user._id });
  if (creatorProfile) filters.push({ creatorProfileId: creatorProfile._id });

  const docs = await BrandInquiry.find({ $or: filters }).sort({ updatedAt: -1, createdAt: -1 }).limit(100).exec();

  return {
    user: {
      id: user._id.toString(),
      username: user.username,
      name: user.name,
      role: user.role,
    },
    collaborations: docs.map((doc) => mapCollaboration(doc as unknown as CollaborationDocument)),
  };
}

export async function getBrandCollaborationDashboard(): Promise<CollaborationDashboardData> {
  const user = await getCurrentUserRecord();
  if (!user) return { user: null, collaborations: [] };

  const brandProfile = await BrandProfile.findOne({ userId: user._id }).exec();
  const filters: Record<string, unknown>[] = [{ createdByClerkId: user.clerkId }, { brandUserId: user._id }];

  if (brandProfile) {
    filters.push({ brandProfileId: brandProfile._id });
    filters.push({ email: brandProfile.contactEmail });
  }

  const docs = await BrandInquiry.find({ $or: filters }).sort({ updatedAt: -1, createdAt: -1 }).limit(100).exec();

  return {
    user: {
      id: user._id.toString(),
      username: user.username,
      name: user.name,
      role: user.role,
    },
    collaborations: docs.map((doc) => mapCollaboration(doc as unknown as CollaborationDocument)),
  };
}

export function groupCollaborationsByStatus(collaborations: BrandInquiryData[], statuses: CollaborationStatus[]) {
  return collaborations.filter((collaboration) => statuses.includes(collaboration.status));
}

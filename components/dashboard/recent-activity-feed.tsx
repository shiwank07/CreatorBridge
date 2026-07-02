import Link from "next/link";
import { RadioTower } from "lucide-react";

import { Badge } from "@/components/shared/badge";
import { formatNotificationTime } from "@/components/notifications/notification-visuals";
import { collaborationDetailsHref } from "@/lib/collaboration-routes";
import { collaborationStatusLabel } from "@/lib/collaborations";
import { formatINR } from "@/lib/format";
import { type BrandInquiryData, type InAppNotificationData, type OfferHistoryEntryData } from "@/lib/types";
import { cn } from "@/lib/utils";

type RecentActivityFeedProps = {
  accountType: "creator" | "brand";
  collaborations: BrandInquiryData[];
  notifications?: InAppNotificationData[];
  className?: string;
};

type ActivityItem = {
  id: string;
  title: string;
  detail: string;
  href: string;
  createdAt?: string;
  tone: "violet" | "green" | "yellow" | "neutral";
};

function actorLabel(actor: OfferHistoryEntryData["actor"]) {
  return actor === "brand" ? "Brand" : "Creator";
}

function offerActivityTitle(entry: OfferHistoryEntryData) {
  const labels: Record<OfferHistoryEntryData["action"], string> = {
    offer_sent: "New collaboration",
    counter_requested: "Counter offer requested",
    counter_sent: "Counter offer sent",
    offer_accepted: "Offer accepted",
    offer_declined: "Offer declined",
  };

  return labels[entry.action];
}

function offerTone(entry: OfferHistoryEntryData): ActivityItem["tone"] {
  if (entry.action === "offer_accepted") return "green";
  if (entry.action === "offer_declined") return "neutral";
  if (entry.action === "counter_requested" || entry.action === "counter_sent") return "yellow";
  return "violet";
}

function offerActivityDetail(entry: OfferHistoryEntryData, collaboration: BrandInquiryData, accountType: "creator" | "brand") {
  const counterpart = accountType === "brand" ? collaboration.creatorUsername ? `@${collaboration.creatorUsername}` : "creator" : collaboration.companyName;
  const amount = entry.amount ? ` at ${formatINR(entry.amount)}` : "";
  const note = entry.note ? `: ${entry.note}` : "";

  return `${actorLabel(entry.actor)} updated ${counterpart}${amount}${note}`;
}

function notificationTone(notification: InAppNotificationData): ActivityItem["tone"] {
  if (notification.event === "verification_approved" || notification.event === "delivery_approved" || notification.event === "creator_accepted") {
    return "green";
  }
  if (notification.event === "verification_rejected" || notification.event === "creator_declined") return "neutral";
  if (notification.event === "proof_submitted" || notification.event === "counter_requested" || notification.event === "counter_sent") return "yellow";
  return "violet";
}

function collaborationDeliveryActivities(collaboration: BrandInquiryData): ActivityItem[] {
  const href = collaborationDetailsHref(collaboration.id);
  const items: ActivityItem[] = [];

  if (collaboration.deliveryProof?.submittedAt) {
    items.push({
      id: `${collaboration.id}-proof-submitted`,
      title: "Proof submitted",
      detail: `${collaboration.creatorUsername ? `@${collaboration.creatorUsername}` : collaboration.companyName} submitted delivery proof.`,
      href,
      createdAt: collaboration.deliveryProof.submittedAt,
      tone: "yellow",
    });
  }

  if (collaboration.status === "approved" && collaboration.deliveryProof?.reviewedAt) {
    items.push({
      id: `${collaboration.id}-delivery-approved`,
      title: "Delivery approved",
      detail: `${collaboration.companyName} approved submitted delivery proof.`,
      href,
      createdAt: collaboration.deliveryProof.reviewedAt,
      tone: "green",
    });
  }

  if (collaboration.status === "changes_requested" && collaboration.deliveryProof?.reviewedAt) {
    items.push({
      id: `${collaboration.id}-changes-requested`,
      title: "Changes requested",
      detail: collaboration.deliveryProof.issueNote || collaboration.deliveryProof.reviewNote || "Brand requested delivery changes.",
      href,
      createdAt: collaboration.deliveryProof.reviewedAt,
      tone: "yellow",
    });
  }

  return items;
}

function sortActivity(items: ActivityItem[]) {
  return items.sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });
}

export function RecentActivityFeed({ accountType, collaborations, notifications = [], className }: RecentActivityFeedProps) {
  const notificationItems: ActivityItem[] = notifications.map((notification) => ({
    id: `notification-${notification.id}`,
    title: notification.title,
    detail: notification.message,
    href: notification.href,
    createdAt: notification.createdAt,
    tone: notificationTone(notification),
  }));

  const collaborationItems = collaborations.flatMap((collaboration) => {
    const href = collaborationDetailsHref(collaboration.id);
    const offerItems = collaboration.offerHistory.map((entry, index) => ({
      id: `${collaboration.id}-offer-${entry.id ?? index}`,
      title: offerActivityTitle(entry),
      detail: offerActivityDetail(entry, collaboration, accountType),
      href,
      createdAt: entry.createdAt ?? collaboration.createdAt,
      tone: offerTone(entry),
    }));

    if (!offerItems.length && collaboration.createdAt) {
      offerItems.push({
        id: `${collaboration.id}-created`,
        title: "New collaboration",
        detail:
          accountType === "brand"
            ? `You sent a collaboration request. Current status: ${collaborationStatusLabel(collaboration.status)}.`
            : `${collaboration.companyName} sent you a collaboration request. Current status: ${collaborationStatusLabel(collaboration.status)}.`,
        href,
        createdAt: collaboration.createdAt,
        tone: "violet",
      });
    }

    return [...offerItems, ...collaborationDeliveryActivities(collaboration)];
  });

  const activity = sortActivity([...notificationItems, ...collaborationItems]).slice(0, 7);

  return (
    <section className={cn("rounded-[8px] border border-white/10 bg-white/[0.04] p-5", className)}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="bridge-eyebrow">Recent Activity</p>
          <h2 className="mt-2 font-display text-2xl font-bold">{accountType === "brand" ? "Campaign log" : "Signal log"}</h2>
        </div>
        <RadioTower size={22} className="text-cyan-200" />
      </div>
      <div className="mt-5 grid gap-3">
        {activity.length ? (
          activity.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="focus-ring flex min-w-0 gap-3 rounded-[8px] border border-white/10 bg-black/20 p-3 transition hover:border-cyan-300/30 hover:bg-cyan-300/10"
            >
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.68)]" />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-semibold text-[var(--text-primary)]">{item.title}</span>
                  <Badge tone={item.tone} className="min-h-6 px-2 py-0.5 text-[11px]">
                    {formatNotificationTime(item.createdAt)}
                  </Badge>
                </span>
                <span className="mt-1 block line-clamp-2 text-xs leading-5 text-[var(--text-secondary)]">{item.detail}</span>
              </span>
            </Link>
          ))
        ) : (
          <div className="rounded-[8px] border border-dashed border-white/10 px-4 py-6 text-sm leading-6 text-[var(--text-secondary)]">
            Collaboration, delivery, and verification activity will appear here.
          </div>
        )}
      </div>
    </section>
  );
}

"use client";

import { CollaborationActions } from "@/components/collaborations/collaboration-actions";
import { type BrandInquiryData, type Role } from "@/lib/types";

type CollaborationDetailActionsProps = {
  collaboration: BrandInquiryData;
  viewerRole: Role;
};

export function CollaborationDetailActions({ collaboration, viewerRole }: CollaborationDetailActionsProps) {
  if (viewerRole !== "creator" && viewerRole !== "brand") {
    return null;
  }

  return (
    <section className="rounded-[8px] border border-white/10 bg-white/[0.04] p-5">
      <p className="bridge-eyebrow">Actions</p>
      <h2 className="mt-2 font-display text-2xl font-bold">Collaboration response</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
        Review the current offer, respond to negotiation changes, and move accepted work forward.
      </p>
      <CollaborationActions collaboration={collaboration} mode={viewerRole} />
    </section>
  );
}

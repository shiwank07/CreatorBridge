const collaborationEvents = new Set([
  "collaboration_request",
  "new_collaboration",
  "brand_response",
  "counter_requested",
  "counter_sent",
  "creator_accepted",
  "creator_declined",
  "proof_submitted",
  "delivery_approved",
  "delivery_changes_requested",
  "collaboration_completed",
]);

export function collaborationDetailsHref(inquiryId?: string | null) {
  return inquiryId ? `/dashboard/collaborations/${encodeURIComponent(inquiryId)}` : "/dashboard";
}

export function notificationTargetHref(event: string, href: string) {
  if (!collaborationEvents.has(event)) return href || "/notifications";
  if (!href) return "/dashboard";

  try {
    const url = new URL(href, "http://creatorbridge.local");
    const canonicalMatch = url.pathname.match(/^\/dashboard\/collaborations\/([^/]+)$/);
    if (canonicalMatch?.[1]) return collaborationDetailsHref(decodeURIComponent(canonicalMatch[1]));

    const inquiryId = url.searchParams.get("collaboration");
    if (inquiryId) return collaborationDetailsHref(inquiryId);

    if (url.pathname.startsWith("/creators/")) return "/dashboard";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/dashboard";
  }
}

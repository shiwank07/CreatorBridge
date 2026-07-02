import {
  BadgeCheck,
  Bell,
  Handshake,
  Mail,
  Megaphone,
  Star,
  TriangleAlert,
  XCircle,
  type LucideIcon,
} from "lucide-react";

type NotificationVisual = {
  label: string;
  Icon: LucideIcon;
  shellClassName: string;
  iconClassName: string;
  accentClassName: string;
};

const notificationVisuals: Record<string, NotificationVisual> = {
  collaboration_request: {
    label: "Collaboration request",
    Icon: Handshake,
    shellClassName: "border-violet-300/25 bg-violet-400/10 text-violet-100",
    iconClassName: "text-violet-100",
    accentClassName: "bg-violet-400",
  },
  new_collaboration: {
    label: "Collaboration request",
    Icon: Handshake,
    shellClassName: "border-violet-300/25 bg-violet-400/10 text-violet-100",
    iconClassName: "text-violet-100",
    accentClassName: "bg-violet-400",
  },
  verification_approved: {
    label: "Verification approved",
    Icon: BadgeCheck,
    shellClassName: "border-emerald-300/25 bg-emerald-400/10 text-emerald-100",
    iconClassName: "text-emerald-100",
    accentClassName: "bg-emerald-400",
  },
  verification_rejected: {
    label: "Verification rejected",
    Icon: XCircle,
    shellClassName: "border-rose-300/25 bg-rose-400/10 text-rose-100",
    iconClassName: "text-rose-100",
    accentClassName: "bg-rose-400",
  },
  brand_response: {
    label: "Brand response",
    Icon: Mail,
    shellClassName: "border-cyan-300/25 bg-cyan-300/10 text-cyan-100",
    iconClassName: "text-cyan-100",
    accentClassName: "bg-cyan-300",
  },
  counter_requested: {
    label: "Counter requested",
    Icon: Mail,
    shellClassName: "border-amber-300/25 bg-amber-300/10 text-amber-100",
    iconClassName: "text-amber-100",
    accentClassName: "bg-amber-300",
  },
  counter_sent: {
    label: "Revised offer",
    Icon: Mail,
    shellClassName: "border-cyan-300/25 bg-cyan-300/10 text-cyan-100",
    iconClassName: "text-cyan-100",
    accentClassName: "bg-cyan-300",
  },
  creator_accepted: {
    label: "Brand response",
    Icon: Mail,
    shellClassName: "border-cyan-300/25 bg-cyan-300/10 text-cyan-100",
    iconClassName: "text-cyan-100",
    accentClassName: "bg-cyan-300",
  },
  creator_declined: {
    label: "Brand response",
    Icon: Mail,
    shellClassName: "border-cyan-300/25 bg-cyan-300/10 text-cyan-100",
    iconClassName: "text-cyan-100",
    accentClassName: "bg-cyan-300",
  },
  proof_submitted: {
    label: "Brand response",
    Icon: Mail,
    shellClassName: "border-cyan-300/25 bg-cyan-300/10 text-cyan-100",
    iconClassName: "text-cyan-100",
    accentClassName: "bg-cyan-300",
  },
  delivery_approved: {
    label: "Brand response",
    Icon: Mail,
    shellClassName: "border-cyan-300/25 bg-cyan-300/10 text-cyan-100",
    iconClassName: "text-cyan-100",
    accentClassName: "bg-cyan-300",
  },
  delivery_changes_requested: {
    label: "Brand response",
    Icon: Mail,
    shellClassName: "border-cyan-300/25 bg-cyan-300/10 text-cyan-100",
    iconClassName: "text-cyan-100",
    accentClassName: "bg-cyan-300",
  },
  featured_creator: {
    label: "Featured creator",
    Icon: Star,
    shellClassName: "border-amber-300/25 bg-amber-300/10 text-amber-100",
    iconClassName: "text-amber-100",
    accentClassName: "bg-amber-300",
  },
  admin_notice: {
    label: "Admin notice",
    Icon: TriangleAlert,
    shellClassName: "border-yellow-300/25 bg-yellow-300/10 text-yellow-100",
    iconClassName: "text-yellow-100",
    accentClassName: "bg-yellow-300",
  },
  system_update: {
    label: "System update",
    Icon: Megaphone,
    shellClassName: "border-sky-300/25 bg-sky-300/10 text-sky-100",
    iconClassName: "text-sky-100",
    accentClassName: "bg-sky-300",
  },
};

const fallbackVisual: NotificationVisual = {
  label: "System update",
  Icon: Bell,
  shellClassName: "border-cyan-300/25 bg-cyan-300/10 text-cyan-100",
  iconClassName: "text-cyan-100",
  accentClassName: "bg-cyan-300",
};

export function getNotificationVisual(event: string) {
  return notificationVisuals[event] ?? fallbackVisual;
}

export function formatNotificationTime(value?: string) {
  if (!value) return "Recently";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.max(0, Math.floor(diffMs / 1000));
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffSeconds < 45) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const notificationDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDiff = Math.round((today.getTime() - notificationDay.getTime()) / 86_400_000);

  if (dayDiff === 1) return "Yesterday";
  if (dayDiff < 7) return `${dayDiff}d ago`;

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(date);
}

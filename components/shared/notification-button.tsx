import Link from "next/link";
import { Bell } from "lucide-react";

import { cn } from "@/lib/utils";

export function NotificationButton({ className }: { className?: string }) {
  return (
    <Link
      href="/notifications"
      aria-label="View notifications"
      className={cn("focus-ring inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-white/[0.05] hover:text-white", className)}
    >
      <Bell aria-hidden="true" size={19} />
    </Link>
  );
}

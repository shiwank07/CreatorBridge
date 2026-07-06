import Image from "next/image";

import { cn } from "@/lib/utils";

type InitialsAvatarProps = {
  name?: string;
  username?: string;
  imageUrl?: string;
  alt?: string;
  sizes?: string;
  className?: string;
  textClassName?: string;
};

function getInitials(name?: string, username?: string) {
  const source = (name?.trim() || username?.trim() || "BZ").replace(/^@/, "");
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export function InitialsAvatar({
  name,
  username,
  imageUrl,
  alt,
  sizes = "44px",
  className,
  textClassName,
}: InitialsAvatarProps) {
  const initials = getInitials(name, username);

  return (
    <span
      className={cn(
        "relative isolate flex shrink-0 items-center justify-center overflow-hidden border border-cyan-200/30 bg-[#0b0f16] text-cyan-50 shadow-[0_0_28px_rgba(103,232,249,0.16)]",
        className,
      )}
      aria-label={alt ?? `${name ?? username ?? "Branzzo"} avatar`}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={alt ?? `${name ?? username ?? "Branzzo"} avatar`}
          fill
          sizes={sizes}
          className="object-cover"
        />
      ) : (
        <>
          <span className="absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgba(103,232,249,0.44),transparent_34%),radial-gradient(circle_at_76%_80%,rgba(124,58,237,0.45),transparent_42%),linear-gradient(135deg,rgba(46,16,101,0.98),rgba(8,47,73,0.9)_58%,rgba(6,10,20,0.96))]" />
          <span className="absolute inset-px rounded-[inherit] border border-white/10" />
          <span className={cn("relative font-display text-sm font-black tracking-normal", textClassName)}>{initials}</span>
        </>
      )}
    </span>
  );
}

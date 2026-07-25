import Image from "next/image";

import { cn } from "@/lib/utils";

type BranzzoLogoProps = {
  showWordmark?: boolean;
  size?: number;
  priority?: boolean;
  className?: string;
  iconClassName?: string;
  wordmarkClassName?: string;
};

export function BranzzoLogo({
  showWordmark = false,
  size = 40,
  priority = false,
  className,
  iconClassName,
  wordmarkClassName,
}: BranzzoLogoProps) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2.5", className)} data-testid="branzzo-logo">
      <Image
        src="/branding/branzzo-logo.png"
        alt={showWordmark ? "" : "Branzzo"}
        width={size}
        height={size}
        priority={priority}
        sizes={`${size}px`}
        className={cn("shrink-0 rounded-[8px] object-contain", iconClassName)}
        style={{ width: size, height: size }}
      />
      {showWordmark ? (
        <span className={cn("truncate font-display font-bold", wordmarkClassName)} data-testid="branzzo-wordmark">
          Branzzo
        </span>
      ) : null}
    </span>
  );
}

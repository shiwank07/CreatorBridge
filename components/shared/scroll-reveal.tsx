"use client";

import React, { useEffect, useRef, useState } from "react";

type ScrollRevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number; // Delay in ms (e.g. 0, 100, 200)
  duration?: number; // Duration in ms (default: 800)
  yOffset?: number; // Distance in px (default: 22)
  threshold?: number; // Viewport trigger percentage (default: 0.15)
  as?: React.ElementType; // Container element type
};

export function ScrollReveal({
  children,
  className = "",
  delay = 0,
  duration = 800,
  yOffset = 22,
  threshold = 0.15,
  as: Component = "div",
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    // Check prefers-reduced-motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      setIsReducedMotion(true);
      setIsRevealed(true);
      return;
    }

    const element = ref.current;
    if (!element) return;

    let timeoutId: NodeJS.Timeout;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (delay > 0) {
              timeoutId = setTimeout(() => {
                setIsRevealed(true);
              }, delay);
            } else {
              setIsRevealed(true);
            }
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold,
        rootMargin: "0px 0px -5% 0px",
      }
    );

    observer.observe(element);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [delay, threshold]);

  // If reduced motion is preferred, render with no animation/transition
  if (isReducedMotion) {
    return <Component className={className}>{children}</Component>;
  }

  const style: React.CSSProperties = {
    opacity: isRevealed ? 1 : 0,
    transform: isRevealed ? "translate3d(0, 0, 0)" : `translate3d(0, ${yOffset}px, 0)`,
    filter: isRevealed ? "blur(0px)" : "blur(4px)",
    transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1), transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1), filter ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`,
    willChange: isRevealed ? "auto" : "opacity, transform, filter",
  };

  return (
    <Component ref={ref} className={className} style={style}>
      {children}
    </Component>
  );
}

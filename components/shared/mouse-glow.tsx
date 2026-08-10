"use client";

import { useEffect, useState } from "react";

export function MouseGlow() {
  const [pos, setPos] = useState({ x: -200, y: -200 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      if (!visible) setVisible(true);
    };

    const handleMouseLeave = () => setVisible(false);

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.body.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.body.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [visible]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-40 overflow-hidden transition-opacity duration-500"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div
        className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl transition-transform duration-100 ease-out"
        style={{
          left: `${pos.x}px`,
          top: `${pos.y}px`,
          width: "220px",
          height: "220px",
          background:
            "radial-gradient(circle, rgba(168, 85, 247, 0.24) 0%, rgba(124, 58, 237, 0.12) 40%, transparent 70%)",
        }}
      />
    </div>
  );
}

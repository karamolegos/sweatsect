"use client";

import { useRef, useState } from "react";
import Image from "next/image";

/**
 * Product-photo hover zoom: image scales up and pans to follow the cursor
 * position within the frame. No-op on touch (no mousemove) — mobile just
 * shows the flat image, which is the right degrade for a lens-zoom pattern.
 */
export function ZoomImage({
  src,
  alt,
  priority,
}: {
  src: string;
  alt: string;
  priority?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin(`${x}% ${y}%`);
  }

  return (
    <div
      ref={containerRef}
      className="relative aspect-[3/4] bg-zinc-50 overflow-hidden cursor-zoom-in"
      onMouseEnter={() => setZoomed(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setZoomed(false)}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        className="object-cover transition-transform duration-200 ease-out"
        style={{
          transform: zoomed ? "scale(1.8)" : "scale(1)",
          transformOrigin: origin,
        }}
        sizes="(max-width: 768px) 100vw, 50vw"
      />
    </div>
  );
}

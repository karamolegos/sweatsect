"use client";

import { useState } from "react";

/**
 * Minimal disclosure section for the product page — title row with a
 * +/− indicator, thin divider styling to match the light theme.
 */
export function AccordionSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-t border-black/10">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left"
        aria-expanded={open}
      >
        <span className="text-[12px] text-black tracking-[0.15em] uppercase">
          {title}
        </span>
        <span className="text-black/40 text-base leading-none select-none" aria-hidden>
          {open ? "−" : "+"}
        </span>
      </button>
      {open && (
        <div className="pb-5 text-[13px] text-black/60 leading-relaxed [&_p]:mb-2">
          {children}
        </div>
      )}
    </div>
  );
}

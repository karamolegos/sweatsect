"use client";

import { useEffect, useState } from "react";

/**
 * Persistent strip showing which gym the signed-in user is locked to.
 * Reads from localStorage (set at gym-code entry, or restored from the
 * profiles table on login) — not props, so it works the same on every
 * authenticated page without each page having to fetch/pass it down.
 */
export function GymBar() {
  const [gymName, setGymName] = useState<string | null>(null);

  useEffect(() => {
    setGymName(localStorage.getItem("sect_gym_name"));
  }, []);

  if (!gymName) return null;

  return (
    <div className="sticky top-0 z-10 -mx-6 mb-8 bg-white/95 backdrop-blur border-b border-black/10 px-6 py-2.5 text-center">
      <p className="text-[10px] text-black/50 tracking-[0.3em] uppercase">
        {gymName}
      </p>
    </div>
  );
}

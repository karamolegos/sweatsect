"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase";

/**
 * Top bar shown on gym-code-gated pages (vault/product/cart/checkout).
 * Left: which gym the visitor is browsing under (localStorage — set at
 * gym-code entry, or restored from the profiles table on login).
 * Right: "Sign up" — classic top-right spot — only shown when there's no
 * active Supabase session yet. Browsing/buying never requires an account;
 * signing up just means "don't ask me for the gym code next time".
 */
export function GymBar() {
  const [gymName, setGymName] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    setGymName(localStorage.getItem("sect_gym_name"));

    const supabase = createBrowserClient();
    supabase.auth.getSession().then(({ data }) => {
      setSignedIn(!!data.session);
    });
  }, []);

  if (!gymName) return null;

  return (
    <div className="sticky top-0 z-10 -mx-6 mb-8 bg-white/95 backdrop-blur border-b border-black/10 px-6 py-2.5 flex items-center justify-between">
      <p className="text-[10px] text-black/50 tracking-[0.3em] uppercase">
        {gymName}
      </p>
      {signedIn === false && (
        <Link
          href="/auth"
          className="text-[10px] text-black/50 tracking-[0.2em] uppercase hover:text-black transition-colors"
        >
          Sign up
        </Link>
      )}
    </div>
  );
}

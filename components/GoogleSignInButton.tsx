"use client";

import { createBrowserClient } from "@/lib/supabase";

/**
 * Redirects to Google OAuth. Supabase always creates a new auth.users row on
 * first Google sign-in (no shouldCreateUser-style flag exists for OAuth like
 * it does for email OTP) — the "must have signed up via gym code first" rule
 * is enforced app-side in /auth/callback by checking for a locked profile.
 */
export function GoogleSignInButton({ label }: { label: string }) {
  async function handleClick() {
    const supabase = createBrowserClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="
        w-full flex items-center justify-center gap-3
        text-xs text-black/70 tracking-[0.1em]
        border border-black/20 px-8 py-3
        hover:border-black hover:text-black
        transition-all duration-200
      "
    >
      <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden>
        <path
          fill="#4285F4"
          d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.61Z"
        />
        <path
          fill="#34A853"
          d="M9 18c2.43 0 4.47-.8 5.96-2.19l-2.9-2.26c-.8.54-1.83.86-3.06.86-2.36 0-4.35-1.59-5.06-3.72H.9v2.33A9 9 0 0 0 9 18Z"
        />
        <path
          fill="#FBBC05"
          d="M3.94 10.69A5.4 5.4 0 0 1 3.66 9c0-.59.1-1.16.28-1.69V4.98H.9A9 9 0 0 0 0 9c0 1.45.35 2.83.9 4.02l3.04-2.33Z"
        />
        <path
          fill="#EA4335"
          d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .9 4.98l3.04 2.33C4.65 5.17 6.64 3.58 9 3.58Z"
        />
      </svg>
      {label}
    </button>
  );
}

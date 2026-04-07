"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase";

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [gymName, setGymName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Must have come from a valid code entry
    const code = sessionStorage.getItem("sect_code");
    if (!code) {
      router.replace("/");
      return;
    }

    // Check if already authenticated — skip straight to vault
    const supabase = createBrowserClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace("/vault");
      }
    });

    setGymName(localStorage.getItem("sect_gym_name"));
    inputRef.current?.focus();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError("");

    const supabase = createBrowserClient();
    const origin = window.location.origin;

    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
        shouldCreateUser: true,
      },
    });

    if (authError) {
      setError("Something went wrong. Try again.");
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <main className="min-h-screen bg-black flex flex-col items-center justify-center px-6 page-in">
        <div className="text-center max-w-xs">
          <p className="text-[10px] text-white/25 tracking-[0.5em] uppercase mb-8">
            Check your inbox
          </p>
          <p className="text-xs text-white/40 tracking-[0.15em] leading-relaxed mb-12">
            We sent a link to{" "}
            <span className="text-white/70">{email}</span>.
            <br />
            Click it to enter the vault.
          </p>
          <button
            onClick={() => setSent(false)}
            className="text-[10px] text-white/20 tracking-[0.4em] uppercase hover:text-white/40 transition-colors"
          >
            Wrong email?
          </button>
        </div>

        <p className="absolute bottom-8 text-[10px] text-white/10 tracking-[0.4em] uppercase">
          SWEAT SECT
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center px-6 page-in">
      <div className="w-full max-w-xs">
        {gymName && (
          <p className="text-[10px] text-white/20 tracking-[0.4em] uppercase text-center mb-12">
            {gymName}
          </p>
        )}

        <p className="text-[10px] text-white/30 tracking-[0.5em] uppercase text-center mb-10">
          Enter your email
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
          <input
            ref={inputRef}
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            placeholder="you@example.com"
            autoComplete="email"
            disabled={loading}
            className="
              w-full bg-transparent border-b border-white/20
              text-white text-sm tracking-[0.15em] text-center
              placeholder:text-white/20
              py-3 transition-colors
              focus:border-white/60 focus:outline-none
              disabled:opacity-40
            "
          />

          {error && (
            <p className="text-xs text-red-500/80 tracking-[0.2em] uppercase">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="
              mt-4 text-xs text-white/50 tracking-[0.4em] uppercase
              border border-white/15 px-8 py-3 w-full
              hover:text-white hover:border-white/40
              disabled:opacity-20 disabled:cursor-not-allowed
              transition-all duration-200
            "
          >
            {loading ? "—" : "Send link"}
          </button>
        </form>
      </div>

      <p className="absolute bottom-8 text-[10px] text-white/10 tracking-[0.4em] uppercase">
        SWEAT SECT
      </p>
    </main>
  );
}

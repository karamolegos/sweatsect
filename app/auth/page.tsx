"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

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
    const code = localStorage.getItem("sect_code");
    if (!code) {
      router.replace("/");
      return;
    }

    // This is a signup (post gym-code) flow — /auth/callback locks the gym
    localStorage.setItem("sect_auth_intent", "signup");

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
      <main className="min-h-screen bg-white flex flex-col items-center justify-center px-6 page-in">
        <div className="text-center max-w-xs">
          <p className="text-sm text-black tracking-[0.15em] uppercase mb-8 font-medium">
            Check your inbox
          </p>
          <p className="text-sm text-black/50 leading-relaxed mb-12">
            We sent a link to{" "}
            <span className="text-black/80">{email}</span>.
            <br />
            Click it to enter the vault.
          </p>
          <button
            onClick={() => setSent(false)}
            className="text-sm text-black/40 hover:text-black transition-colors"
          >
            Wrong email?
          </button>
        </div>

        <p className="absolute bottom-8 text-xs text-black/25 tracking-[0.4em] uppercase">
          SWEAT SECT
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-6 page-in">
      <div className="w-full max-w-xs">
        {gymName && (
          <p className="text-xs text-black/40 tracking-[0.2em] uppercase text-center mb-12">
            {gymName}
          </p>
        )}

        <p className="text-base text-black tracking-[0.1em] uppercase text-center mb-10 font-medium">
          Create your account
        </p>

        <div className="mb-6">
          <GoogleSignInButton label="Continue with Google" />
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-black/10" />
          <span className="text-xs text-black/30 uppercase">or</span>
          <div className="flex-1 h-px bg-black/10" />
        </div>

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
              w-full bg-transparent border-b border-black/20
              text-black text-base text-center
              placeholder:text-black/30
              py-3 transition-colors
              focus:border-black/60 focus:outline-none
              disabled:opacity-40
            "
          />

          {error && (
            <p className="text-sm text-red-600 uppercase">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="
              mt-4 text-sm text-white tracking-[0.2em] uppercase
              bg-black px-8 py-3 w-full font-medium
              hover:bg-black/80
              disabled:opacity-20 disabled:cursor-not-allowed
              transition-all duration-200
            "
          >
            {loading ? "—" : "Send link"}
          </button>
        </form>
      </div>

      <p className="absolute bottom-8 text-[10px] text-black/20 tracking-[0.4em] uppercase">
        SWEAT SECT
      </p>
    </main>
  );
}

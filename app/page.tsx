"use client";

import { Suspense, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

function LandingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loginError = searchParams.get("error") === "signup_required";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/validate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });

      const data = (await res.json()) as {
        valid: boolean;
        gym_id?: string;
        gym_name?: string;
        error?: string;
      };

      if (data.valid) {
        // Persist to localStorage (not sessionStorage) so the gym lock
        // survives across tabs/devices for the "always signed in" flow.
        // sect_auth_intent is NOT set here — browsing doesn't imply signup;
        // /auth/page.tsx sets it itself if/when the visitor chooses to sign up.
        localStorage.setItem("sect_code", code.trim().toUpperCase());
        if (data.gym_id) localStorage.setItem("sect_gym_id", data.gym_id);
        if (data.gym_name) localStorage.setItem("sect_gym_name", data.gym_name);
        router.push("/vault");
      } else {
        setError("Code not recognised.");
        setCode("");
        inputRef.current?.focus();
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-16">
      {/* Wordmark */}
      <Image
        src="/sweat-sect-wordmark.svg"
        alt="Sweat Sect"
        width={1200}
        height={260}
        priority
        className="w-64 sm:w-80 md:w-[420px] h-auto mb-8"
      />

      {/* Tagline */}
      <p className="text-base sm:text-lg text-black/40 tracking-[0.35em] uppercase mb-20 text-center">
        Wear it like you earned it
      </p>

      {loginError && (
        <p className="text-sm text-red-600 tracking-[0.1em] text-center mb-8 max-w-sm">
          Please enter your gym&apos;s code to create an account first.
        </p>
      )}

      {/* Code input form */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm flex flex-col items-center gap-6"
      >
        <div className="w-full">
          <input
            ref={inputRef}
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError("");
            }}
            placeholder="ENTER YOUR CODE"
            maxLength={20}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            disabled={loading}
            className="
              w-full bg-transparent border-b border-black/20
              text-black text-lg tracking-[0.3em] text-center
              placeholder:text-black/30 placeholder:tracking-[0.25em]
              py-4 transition-colors
              focus:border-black/60 focus:outline-none
              disabled:opacity-40
            "
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 tracking-[0.2em] uppercase">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="
            mt-6 text-base text-white tracking-[0.4em] uppercase
            bg-black px-8 py-4 w-full
            hover:bg-black/80
            disabled:opacity-20 disabled:cursor-not-allowed
            transition-all duration-200
          "
        >
          {loading ? "—" : "Unlock"}
        </button>
      </form>

      {/* Returning member */}
      <Link
        href="/login"
        className="mt-14 text-base text-black/40 hover:text-black transition-colors"
      >
        Already a member? Log in
      </Link>
    </main>
  );
}

export default function LandingPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-white flex items-center justify-center">
          <span className="text-black/20 text-xs tracking-[0.4em]">—</span>
        </main>
      }
    >
      <LandingContent />
    </Suspense>
  );
}

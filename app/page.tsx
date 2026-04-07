"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

      const data = (await res.json()) as { valid: boolean; error?: string };

      if (data.valid) {
        // Save gym info for the auth step
        sessionStorage.setItem("sect_code", code.trim().toUpperCase());
        if (data.gym_id) localStorage.setItem("sect_gym_id", data.gym_id);
        if (data.gym_name) localStorage.setItem("sect_gym_name", data.gym_name);
        router.push("/auth");
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
    <main className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
      {/* Logo mark */}
      <div className="mb-16 select-none" aria-hidden>
        <SectMark />
      </div>

      {/* Tagline */}
      <p className="text-xs text-white/30 tracking-[0.4em] uppercase mb-12 text-center">
        Wear it like you earned it
      </p>

      {/* Code input form */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xs flex flex-col items-center gap-4"
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
              w-full bg-transparent border-b border-white/20
              text-white text-sm tracking-[0.3em] text-center
              placeholder:text-white/20 placeholder:tracking-[0.25em]
              py-3 transition-colors
              focus:border-white/60 focus:outline-none
              disabled:opacity-40
            "
          />
        </div>

        {error && (
          <p className="text-xs text-red-500/80 tracking-[0.2em] uppercase">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="
            mt-4 text-xs text-white/50 tracking-[0.4em] uppercase
            border border-white/15 px-8 py-3 w-full
            hover:text-white hover:border-white/40
            disabled:opacity-20 disabled:cursor-not-allowed
            transition-all duration-200
          "
        >
          {loading ? "—" : "Unlock"}
        </button>
      </form>

      {/* Footer brand */}
      <p className="absolute bottom-8 text-[10px] text-white/10 tracking-[0.4em] uppercase">
        SWEAT SECT
      </p>
    </main>
  );
}

function SectMark() {
  return (
    <svg
      width="52"
      height="52"
      viewBox="0 0 52 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer ring */}
      <circle cx="26" cy="26" r="24" stroke="white" strokeWidth="0.75" />
      {/* Inner ring — subtle weight plate reference */}
      <circle
        cx="26"
        cy="26"
        r="17"
        stroke="white"
        strokeWidth="0.4"
        opacity="0.25"
      />
      {/* S-curve — branding iron concept */}
      <path
        d="M18 21 C18 15.5 34 15.5 34 21 C34 25.5 18 25.5 18 31 C18 36.5 34 36.5 34 31"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

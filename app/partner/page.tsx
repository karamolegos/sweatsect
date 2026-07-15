"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function PartnerLoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pin.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/partner/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pin.trim() }),
      });
      const data = (await res.json()) as { valid: boolean; gym_name?: string };

      if (data.valid) {
        localStorage.setItem("partner_pin", pin.trim());
        if (data.gym_name) localStorage.setItem("partner_gym_name", data.gym_name);
        router.push("/partner/dashboard");
      } else {
        setError("PIN not recognised.");
        setPin("");
        inputRef.current?.focus();
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <p className="text-[11px] text-black/40 tracking-[0.4em] uppercase mb-12 text-center">
        Partner Portal
      </p>

      <form onSubmit={handleSubmit} className="w-full max-w-xs flex flex-col items-center gap-4">
        <input
          ref={inputRef}
          type="text"
          value={pin}
          onChange={(e) => {
            setPin(e.target.value.replace(/\D/g, "").slice(0, 6));
            setError("");
          }}
          placeholder="6-DIGIT PIN"
          inputMode="numeric"
          maxLength={6}
          autoComplete="off"
          disabled={loading}
          className="
            w-full bg-transparent border-b border-black/20
            text-black text-sm tracking-[0.3em] text-center
            placeholder:text-black/30 placeholder:tracking-[0.25em]
            py-3 transition-colors
            focus:border-black/60 focus:outline-none
            disabled:opacity-40
          "
        />

        {error && (
          <p className="text-xs text-red-600 tracking-[0.2em] uppercase">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || pin.length < 4}
          className="
            mt-4 text-sm text-white tracking-[0.4em] uppercase
            bg-black px-8 py-3 w-full
            hover:bg-black/80
            disabled:opacity-20 disabled:cursor-not-allowed
            transition-all duration-200
          "
        >
          {loading ? "—" : "Enter"}
        </button>
      </form>

      <p className="absolute bottom-8 text-xs text-black/25 tracking-[0.4em] uppercase">
        SWEAT SECT
      </p>
    </main>
  );
}

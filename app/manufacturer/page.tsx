"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";

type Feasibility = "yes" | "maybe" | "no";

interface Review {
  feasibility: Feasibility;
  notes: string | null;
  updated_at: string;
}

interface ProductRow {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  review: Review | null;
}

// Secret is entered once per session and kept in memory
const SECRET_KEY = "mfr_secret";

export default function ManufacturerPage() {
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<number | null>(null);

  // Per-product local state: feasibility + notes (before save)
  const [local, setLocal] = useState<
    Record<number, { feasibility: Feasibility | null; notes: string }>
  >({});

  const inputRef = useRef<HTMLInputElement>(null);

  function headers() {
    return { "x-manufacturer-secret": secret, "Content-Type": "application/json" };
  }

  async function authenticate() {
    setAuthError("");
    setLoading(true);
    try {
      const res = await fetch("/api/manufacturer", { headers: headers() });
      if (!res.ok) {
        setAuthError("Wrong password. Try again.");
        setLoading(false);
        return;
      }
      const data: ProductRow[] = await res.json();
      setProducts(data);
      // Seed local state from existing reviews
      const init: Record<number, { feasibility: Feasibility | null; notes: string }> = {};
      data.forEach((p) => {
        init[p.id] = {
          feasibility: p.review?.feasibility ?? null,
          notes: p.review?.notes ?? "",
        };
      });
      setLocal(init);
      setAuthed(true);
    } catch {
      setAuthError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function saveReview(product: ProductRow) {
    const l = local[product.id];
    if (!l?.feasibility) return;
    setSaving(product.id);
    try {
      const res = await fetch("/api/manufacturer", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          product_id: product.id,
          product_name: product.name,
          feasibility: l.feasibility,
          notes: l.notes.trim() || null,
        }),
      });
      if (!res.ok) throw new Error();
      const updated: Review & { product_id: number } = await res.json();
      // Sync updated_at from server
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id
            ? {
                ...p,
                review: {
                  feasibility: updated.feasibility,
                  notes: updated.notes,
                  updated_at: updated.updated_at,
                },
              }
            : p
        )
      );
    } finally {
      setSaving(null);
    }
  }

  function setFeasibility(id: number, v: Feasibility) {
    setLocal((prev) => ({ ...prev, [id]: { ...prev[id], feasibility: v } }));
  }

  function setNotes(id: number, v: string) {
    setLocal((prev) => ({ ...prev, [id]: { ...prev[id], notes: v } }));
  }

  const reviewed = products.filter((p) => p.review).length;
  const total = products.length;

  // --- Auth gate ---
  if (!authed) {
    return (
      <main className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
        <p className="text-[10px] text-white/20 tracking-[0.5em] uppercase mb-10">
          Manufacturer Portal
        </p>
        <form
          onSubmit={(e) => { e.preventDefault(); authenticate(); }}
          className="flex flex-col gap-4 w-full max-w-xs"
        >
          <input
            ref={inputRef}
            type="password"
            placeholder="Enter access code"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="bg-zinc-900 border border-white/10 text-white text-xs tracking-widest px-4 py-3 outline-none focus:border-white/30 placeholder:text-white/20"
            autoFocus
          />
          {authError && (
            <p className="text-[10px] text-red-400/70 tracking-widest">{authError}</p>
          )}
          <button
            type="submit"
            disabled={loading || !secret}
            className="bg-white text-black text-[10px] tracking-[0.4em] uppercase px-4 py-3 hover:bg-white/90 disabled:opacity-30 transition-opacity"
          >
            {loading ? "..." : "Enter"}
          </button>
        </form>
      </main>
    );
  }

  // --- Main portal ---
  return (
    <main className="min-h-screen bg-black px-6 py-16">
      {/* Header */}
      <div className="max-w-3xl mx-auto mb-12">
        <p className="text-[10px] text-white/20 tracking-[0.5em] uppercase mb-2">
          Manufacturer Review
        </p>
        {/* Progress */}
        <div className="flex items-center gap-4 mt-4">
          <div className="flex-1 h-px bg-white/10">
            <div
              className="h-px bg-white/40 transition-all duration-500"
              style={{ width: total ? `${(reviewed / total) * 100}%` : "0%" }}
            />
          </div>
          <span className="text-[10px] text-white/30 tracking-widest tabular-nums">
            {reviewed} / {total}
          </span>
        </div>
      </div>

      {/* Product list */}
      <div className="max-w-3xl mx-auto flex flex-col gap-8">
        {products.map((product) => {
          const l = local[product.id] ?? { feasibility: null, notes: "" };
          const isSaved = !!product.review;
          const isDirty =
            l.feasibility !== (product.review?.feasibility ?? null) ||
            l.notes !== (product.review?.notes ?? "");

          return (
            <div
              key={product.id}
              className="border border-white/8 p-6 flex flex-col sm:flex-row gap-6"
            >
              {/* Product image */}
              <div className="relative w-full sm:w-24 h-40 sm:h-24 bg-zinc-950 flex-shrink-0 overflow-hidden">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-white/10 text-xs tracking-widest">
                    —
                  </span>
                )}
              </div>

              {/* Review controls */}
              <div className="flex-1 flex flex-col gap-4">
                <p className="text-xs text-white/60 tracking-[0.2em] uppercase">
                  {product.name}
                </p>

                {/* Feasibility buttons */}
                <div className="flex gap-2">
                  {(["yes", "maybe", "no"] as Feasibility[]).map((opt) => {
                    const labels: Record<Feasibility, string> = {
                      yes: "✓ Can do",
                      maybe: "~ Maybe",
                      no: "✗ Cannot",
                    };
                    const active = l.feasibility === opt;
                    const colors: Record<Feasibility, string> = {
                      yes: active ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-300" : "border-white/10 text-white/30 hover:text-white/60",
                      maybe: active ? "bg-amber-500/20 border-amber-500/60 text-amber-300" : "border-white/10 text-white/30 hover:text-white/60",
                      no: active ? "bg-red-500/20 border-red-500/60 text-red-300" : "border-white/10 text-white/30 hover:text-white/60",
                    };
                    return (
                      <button
                        key={opt}
                        onClick={() => setFeasibility(product.id, opt)}
                        className={`border text-[10px] tracking-widest px-3 py-1.5 transition-all ${
                          colors[opt]
                        }`}
                      >
                        {labels[opt]}
                      </button>
                    );
                  })}
                </div>

                {/* Notes textarea */}
                <textarea
                  value={l.notes}
                  onChange={(e) => setNotes(product.id, e.target.value)}
                  placeholder="Notes (optional) — fabric, construction, timeline..."
                  rows={2}
                  className="bg-zinc-900 border border-white/10 text-white/70 text-xs px-3 py-2 outline-none focus:border-white/30 placeholder:text-white/15 resize-none"
                />

                {/* Footer row */}
                <div className="flex items-center justify-between gap-4">
                  {isSaved && !isDirty ? (
                    <p className="text-[10px] text-white/20 tracking-widest">
                      Saved{" "}
                      {new Date(product.review!.updated_at).toLocaleDateString(
                        "en-GB",
                        { day: "numeric", month: "short", year: "numeric" }
                      )}
                    </p>
                  ) : (
                    <span />
                  )}

                  <button
                    disabled={!l.feasibility || !isDirty || saving === product.id}
                    onClick={() => saveReview(product)}
                    className="text-[10px] tracking-[0.3em] uppercase px-4 py-1.5 border border-white/20 text-white/50 hover:text-white hover:border-white/40 disabled:opacity-20 transition-all"
                  >
                    {saving === product.id ? "Saving..." : isSaved && isDirty ? "Update" : "Submit"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-center text-[10px] text-white/8 tracking-[0.4em] uppercase mt-24">
        SWEAT SECT
      </p>
    </main>
  );
}

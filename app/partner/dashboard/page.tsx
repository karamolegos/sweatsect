"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Stats {
  gym_name: string;
  commission_rate: number;
  summary: {
    order_count: number;
    total_sales: number;
    total_commission: number;
    pending_commission: number;
    paid_commission: number;
  };
  orders: {
    order_id: number;
    amount: number;
    status: "pending" | "paid";
    created_at: string;
  }[];
}

export default function PartnerDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const pin = localStorage.getItem("partner_pin");
    if (!pin) {
      router.replace("/partner");
      return;
    }

    fetch("/api/partner/stats", { headers: { "x-partner-pin": pin } })
      .then((r) => {
        if (!r.ok) throw new Error("unauthorized");
        return r.json();
      })
      .then((data: Stats) => setStats(data))
      .catch(() => {
        localStorage.removeItem("partner_pin");
        localStorage.removeItem("partner_gym_name");
        router.replace("/partner");
      })
      .finally(() => setLoading(false));
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("partner_pin");
    localStorage.removeItem("partner_gym_name");
    router.push("/partner");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <span className="text-black/20 text-xs tracking-[0.4em]">—</span>
      </main>
    );
  }

  if (!stats) return null;

  return (
    <main className="min-h-screen bg-white px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-[11px] text-black/40 tracking-[0.3em] uppercase mb-1">
              Partner Portal
            </p>
            <p className="text-sm text-black">{stats.gym_name}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-[11px] text-black/50 tracking-[0.1em] uppercase hover:text-black transition-colors"
          >
            Log out
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-black/10 mb-10">
          <div className="bg-white p-4">
            <p className="text-[10px] text-black/40 tracking-[0.15em] uppercase mb-2">
              Orders
            </p>
            <p className="text-lg text-black">{stats.summary.order_count}</p>
          </div>
          <div className="bg-white p-4">
            <p className="text-[10px] text-black/40 tracking-[0.15em] uppercase mb-2">
              Sales
            </p>
            <p className="text-lg text-black">€{stats.summary.total_sales.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4">
            <p className="text-[10px] text-black/40 tracking-[0.15em] uppercase mb-2">
              Pending
            </p>
            <p className="text-lg text-black">€{stats.summary.pending_commission.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4">
            <p className="text-[10px] text-black/40 tracking-[0.15em] uppercase mb-2">
              Paid
            </p>
            <p className="text-lg text-black">€{stats.summary.paid_commission.toFixed(2)}</p>
          </div>
        </div>

        <p className="text-[10px] text-black/30 tracking-[0.15em] uppercase mb-8">
          {(stats.commission_rate * 100).toFixed(0)}% commission per sale
        </p>

        {/* Orders list */}
        <p className="text-[11px] text-black/40 tracking-[0.2em] uppercase border-t border-b border-black/10 py-4 mb-4">
          Commission Ledger
        </p>

        {error && <p className="text-xs text-red-600 mb-4">{error}</p>}

        {stats.orders.length === 0 ? (
          <p className="text-xs text-black/30 tracking-[0.2em] uppercase">
            No sales yet.
          </p>
        ) : (
          <div className="space-y-2">
            {stats.orders.map((o) => (
              <div
                key={o.order_id}
                className="flex justify-between items-center border-b border-black/5 py-3"
              >
                <div>
                  <p className="text-[12px] text-black">Order #{o.order_id}</p>
                  <p className="text-[10px] text-black/40">
                    {new Date(o.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`text-[10px] tracking-[0.15em] uppercase ${
                      o.status === "paid" ? "text-black/40" : "text-black"
                    }`}
                  >
                    {o.status}
                  </span>
                  <p className="text-[12px] text-black w-16 text-right">
                    €{Number(o.amount).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

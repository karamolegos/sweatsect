"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createBrowserClient } from "@/lib/supabase";
import type { WCOrder } from "@/types";

export default function AccountPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [gymName, setGymName] = useState<string | null>(null);
  const [orders, setOrders] = useState<WCOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const supabase = createBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      setEmail(session.user.email ?? null);
      setGymName(localStorage.getItem("sect_gym_name"));

      fetch("/api/my-orders", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
        .then((r) => r.json())
        .then((data: WCOrder[]) => setOrders(Array.isArray(data) ? data : []))
        .catch(console.error)
        .finally(() => setLoading(false));
    }

    init();
  }, [router]);

  async function handleLogout() {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    // Gym lock stays — signing out just ends the account session, not the
    // gym context, so /vault still works as a guest afterward.
    router.push("/vault");
  }

  return (
    <main className="min-h-screen bg-white px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.back()}
          className="text-[11px] text-black/40 tracking-[0.1em] uppercase hover:text-black transition-colors mb-10 block"
        >
          ← Back
        </button>

        <p className="text-[11px] text-black/40 tracking-[0.3em] uppercase mb-2">
          Account
        </p>
        {email && <p className="text-sm text-black mb-1">{email}</p>}
        {gymName && (
          <p className="text-[12px] text-black/50 mb-10">
            Linked to <span className="text-black">{gymName}</span>
          </p>
        )}

        <div className="flex items-center justify-between border-t border-b border-black/10 py-4 mb-10">
          <p className="text-[11px] text-black/40 tracking-[0.2em] uppercase">
            Order History
          </p>
          <button
            onClick={handleLogout}
            className="text-[11px] text-black/50 tracking-[0.1em] uppercase hover:text-black transition-colors"
          >
            Log out
          </button>
        </div>

        {loading ? (
          <p className="text-xs text-black/30 tracking-[0.2em]">—</p>
        ) : orders.length === 0 ? (
          <p className="text-xs text-black/30 tracking-[0.2em] uppercase">
            No orders yet.
          </p>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="border border-black/10 p-5">
                <div className="flex justify-between items-baseline mb-4">
                  <p className="text-[12px] text-black tracking-[0.1em]">
                    Order #{order.number}
                  </p>
                  <p className="text-[10px] text-black/40 tracking-[0.15em] uppercase">
                    {order.status}
                  </p>
                </div>
                <div className="space-y-3 mb-4">
                  {order.line_items.map((item, i) => (
                    <div key={i} className="flex gap-3 items-center">
                      {item.image?.src ? (
                        <div className="relative w-10 h-10 flex-shrink-0 bg-zinc-100 overflow-hidden">
                          <Image
                            src={item.image.src}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 flex-shrink-0 bg-zinc-100" />
                      )}
                      <p className="text-[12px] text-black/60 flex-1">
                        {item.name} ×{item.quantity}
                      </p>
                      <p className="text-[12px] text-black/60">
                        €{parseFloat(item.total).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between border-t border-black/10 pt-3">
                  <p className="text-[10px] text-black/40 tracking-[0.15em] uppercase">
                    {new Date(order.date_created).toLocaleDateString()}
                  </p>
                  <p className="text-[12px] text-black">
                    €{parseFloat(order.total).toFixed(2)}
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

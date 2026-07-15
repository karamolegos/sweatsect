"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { CartItem } from "@/types";
import { GymBar } from "@/components/GymBar";

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("sect_code")) {
      router.replace("/");
      return;
    }
    const cart = JSON.parse(sessionStorage.getItem("sect_cart") || "[]");
    setItems(cart);
    setLoaded(true);
  }, [router]);

  function removeItem(index: number) {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    sessionStorage.setItem("sect_cart", JSON.stringify(updated));
  }

  function updateQty(index: number, delta: number) {
    const updated = items
      .map((item, i) =>
        i === index ? { ...item, quantity: item.quantity + delta } : item
      )
      .filter((item) => item.quantity > 0);
    setItems(updated);
    sessionStorage.setItem("sect_cart", JSON.stringify(updated));
  }

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  if (!loaded) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <span className="text-black/20 text-xs tracking-[0.4em]">—</span>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-6 py-6">
      <GymBar />
      <div className="max-w-xl mx-auto pt-10">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="text-sm text-black/40 tracking-[0.05em] uppercase hover:text-black transition-colors mb-12 block"
        >
          ← Continue Shopping
        </button>

        <p className="text-base text-black tracking-[0.15em] uppercase mb-10 font-medium">
          Your Bag
        </p>

        {items.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-xs text-black/30 tracking-[0.3em] uppercase">
              Empty.
            </p>
          </div>
        ) : (
          <>
            {/* Items */}
            <div className="space-y-6 mb-10">
              {items.map((item, i) => (
                <div
                  key={`${item.product_id}-${item.variation_id ?? 0}`}
                  className="flex gap-4 items-start border-b border-black/10 pb-6"
                >
                  {/* Image */}
                  {item.image ? (
                    <div className="relative w-16 aspect-[3/4] flex-shrink-0 bg-zinc-100 overflow-hidden">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                  ) : (
                    <div className="w-16 aspect-[3/4] flex-shrink-0 bg-zinc-100" />
                  )}

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-black mb-1 truncate">
                      {item.name}
                    </p>
                    {item.attributes?.map((a) => (
                      <p
                        key={a.name}
                        className="text-xs text-black/40 uppercase"
                      >
                        {a.option}
                      </p>
                    ))}
                    <p className="text-sm text-black/60 mt-2">
                      €{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>

                  {/* Qty + remove */}
                  <div className="flex flex-col items-end gap-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateQty(i, -1)}
                        className="text-black/40 hover:text-black text-base w-5 text-center transition-colors"
                      >
                        −
                      </button>
                      <span className="text-sm text-black/70 w-4 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQty(i, 1)}
                        className="text-black/40 hover:text-black text-base w-5 text-center transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(i)}
                      className="text-xs text-black/30 hover:text-black uppercase transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="flex justify-between items-baseline mb-8">
              <p className="text-sm text-black/40 tracking-[0.1em] uppercase">
                Total
              </p>
              <p className="text-lg text-black font-medium">€{total.toFixed(2)}</p>
            </div>

            {/* Checkout CTA */}
            <button
              onClick={() => router.push("/checkout")}
              className="
                w-full text-sm tracking-[0.1em] uppercase py-4 font-medium
                bg-black text-white
                hover:bg-black/80
                transition-all duration-200
              "
            >
              Proceed to Payment
            </button>
          </>
        )}
      </div>
    </main>
  );
}

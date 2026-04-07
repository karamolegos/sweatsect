"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { WCProduct } from "@/types";
import { createBrowserClient } from "@/lib/supabase";

export default function VaultPage() {
  const router = useRouter();
  const [products, setProducts] = useState<WCProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [gymCode, setGymCode] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      // Guard 1: must have a Supabase session (authenticated user)
      const supabase = createBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/");
        return;
      }

      // Guard 2: must have a gym code in sessionStorage
      // (returning users who land directly on /vault won't have one — fetch from profile)
      let code = sessionStorage.getItem("sect_code");
      if (!code) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("gym_id, gyms(code)")
          .eq("user_id", session.user.id)
          .single();
        if (profile?.gyms) {
          const g = profile.gyms as { code: string };
          code = g.code;
          sessionStorage.setItem("sect_code", code);
        } else {
          // No gym locked — send back to start
          router.replace("/");
          return;
        }
      }

      setGymCode(code);

      // Fetch products from WooCommerce via server route
      fetch("/api/products")
        .then((r) => r.json())
        .then((data: WCProduct[]) => setProducts(data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }

    init();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <span className="text-white/20 text-xs tracking-[0.4em] uppercase">—</span>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-6 py-16">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-16">
        <p className="text-[10px] text-white/20 tracking-[0.5em] uppercase mb-2">
          The Vault
        </p>
        <p className="text-[10px] text-white/10 tracking-[0.3em] uppercase">
          {gymCode}
        </p>
      </div>

      {/* Product grid */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-8">
        {products.map((product, i) => (
          <ProductCard
            key={product.id}
            product={product}
            delay={i * 80}
          />
        ))}
      </div>

      {/* Empty state */}
      {!loading && products.length === 0 && (
        <div className="max-w-4xl mx-auto text-center py-32">
          <p className="text-xs text-white/20 tracking-[0.3em] uppercase">
            Coming soon.
          </p>
        </div>
      )}

      {/* Footer */}
      <p className="text-center text-[10px] text-white/8 tracking-[0.4em] uppercase mt-24">
        SWEAT SECT
      </p>
    </main>
  );
}

function ProductCard({
  product,
  delay,
}: {
  product: WCProduct;
  delay: number;
}) {
  const image = product.images?.[0];

  return (
    <a
      href={`/product/${product.slug}`}
      className="group block"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Image container */}
      <div className="relative aspect-[3/4] bg-zinc-950 overflow-hidden mb-4">
        {image ? (
          <Image
            src={image.src}
            alt={image.alt || product.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, 50vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white/10 text-xs tracking-[0.4em] uppercase">
              —
            </span>
          </div>
        )}

        {/* Out of stock overlay */}
        {product.stock_status !== "instock" && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white/40 text-[10px] tracking-[0.4em] uppercase">
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* Product info */}
      <div className="flex justify-between items-baseline">
        <p className="text-xs text-white/70 tracking-[0.2em] uppercase group-hover:text-white transition-colors">
          {product.name}
        </p>
        <p className="text-xs text-white/50">
          €{parseFloat(product.price).toFixed(2)}
        </p>
      </div>
    </a>
  );
}

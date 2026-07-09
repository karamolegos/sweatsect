"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { WCProduct } from "@/types";
import { createBrowserClient } from "@/lib/supabase";
import { GymBar } from "@/components/GymBar";

export default function VaultPage() {
  const router = useRouter();
  const [products, setProducts] = useState<WCProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      // Browsing only requires a validated gym code — no account needed.
      // Signing up is optional (top-right link in GymBar); it just means
      // "remember my gym, skip the code next time".
      let code = localStorage.getItem("sect_code");

      // No code locally, but maybe a still-valid Supabase session from a
      // previous signup on this device — restore the gym from their profile
      // instead of bouncing them back to the code screen.
      if (!code) {
        const supabase = createBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("gym_id, gyms(code, name)")
            .eq("user_id", session.user.id)
            .single();
          // supabase-js types joined relations as array; runtime returns
          // object for a to-one FK — handle both shapes
          const g = (Array.isArray(profile?.gyms) ? profile?.gyms[0] : profile?.gyms) as
            | { code: string; name: string }
            | undefined;
          if (g?.code) {
            code = g.code;
            localStorage.setItem("sect_code", code);
            localStorage.setItem("sect_gym_name", g.name);
          }
        }

        if (!code) {
          // Genuinely no gym context — send back to start
          router.replace("/");
          return;
        }
      }

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
      <main className="min-h-screen bg-white flex items-center justify-center">
        <span className="text-black/20 text-xs tracking-[0.4em] uppercase">—</span>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-6 py-6">
      <GymBar />

      {/* Header */}
      <div className="max-w-6xl mx-auto mb-10">
        <p className="text-[11px] text-black/60 tracking-[0.3em] uppercase">
          Sweat Sect
        </p>
      </div>

      {/* Product grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-10">
        {products.map((product, i) => (
          <ProductCard
            key={product.id}
            product={product}
            delay={i * 60}
          />
        ))}
      </div>

      {/* Empty state */}
      {!loading && products.length === 0 && (
        <div className="max-w-6xl mx-auto text-center py-32">
          <p className="text-xs text-black/30 tracking-[0.3em] uppercase">
            Coming soon.
          </p>
        </div>
      )}

      {/* Footer */}
      <p className="text-center text-[10px] text-black/15 tracking-[0.4em] uppercase mt-24">
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
  const [activeImage, setActiveImage] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [saved, setSaved] = useState(false);
  const images = product.images ?? [];
  const shown = images[activeImage] ?? images[0];

  useEffect(() => {
    try {
      const favorites: number[] = JSON.parse(localStorage.getItem("sect_favorites") || "[]");
      setSaved(favorites.includes(product.id));
    } catch {
      // ignore malformed storage
    }
  }, [product.id]);

  function toggleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const favorites: number[] = JSON.parse(localStorage.getItem("sect_favorites") || "[]");
    const next = saved
      ? favorites.filter((id) => id !== product.id)
      : [...favorites, product.id];
    localStorage.setItem("sect_favorites", JSON.stringify(next));
    setSaved(!saved);
  }

  return (
    <a
      href={`/product/${product.slug}`}
      className="group block fade-in"
      style={{ animationDelay: `${delay}ms` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setActiveImage(0);
      }}
    >
      {/* Image container — light studio backdrop, matches product photography */}
      <div className="relative aspect-[3/4] bg-zinc-100 overflow-hidden mb-3">
        {shown ? (
          <Image
            src={shown.src}
            alt={shown.alt || product.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-black/10 text-xs tracking-[0.4em] uppercase">
              —
            </span>
          </div>
        )}

        {/* Wishlist toggle */}
        <button
          onClick={toggleFavorite}
          aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center"
        >
          <svg
            viewBox="0 0 24 24"
            className="w-[18px] h-[18px]"
            fill={saved ? "#000" : "none"}
            stroke="#000"
            strokeWidth={1.5}
          >
            <path d="M12 20.5s-7.5-4.6-10-9.1C.4 8.1 1.8 4.5 5.2 3.6c2-.5 4 .3 5.3 2 .5.6.9 1.3 1.5 1.3s1-.7 1.5-1.3c1.3-1.7 3.3-2.5 5.3-2 3.4.9 4.8 4.5 3.2 7.8-2.5 4.5-10 9.1-10 9.1Z" />
          </svg>
        </button>

        {/* Thumbnail-preview strip — only when there's more than one photo */}
        {hovered && images.length > 1 && (
          <div className="absolute bottom-0 inset-x-0 flex gap-1 p-1.5 bg-gradient-to-t from-white/90 to-transparent">
            {images.map((img, i) => (
              <button
                key={img.id}
                onMouseEnter={() => setActiveImage(i)}
                className={`h-1 flex-1 transition-colors ${
                  i === activeImage ? "bg-black" : "bg-black/20"
                }`}
                aria-label={`Show photo ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* Out of stock overlay */}
        {product.stock_status !== "instock" && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="text-black/50 text-[10px] tracking-[0.4em] uppercase">
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* Product info — price first, then name, then category */}
      <div>
        <p className="text-[13px] text-black font-medium">
          €{parseFloat(product.price).toFixed(2)}
        </p>
        <p className="text-[13px] text-black/70 mt-0.5 group-hover:text-black transition-colors">
          {product.name}
        </p>
      </div>
    </a>
  );
}

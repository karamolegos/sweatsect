"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import type { WCProduct, WCVariation } from "@/types";

export default function ProductPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();

  const [product, setProduct] = useState<WCProduct | null>(null);
  const [variations, setVariations] = useState<WCVariation[]>([]);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<WCVariation | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    // Guard
    if (!sessionStorage.getItem("sect_code")) {
      router.replace("/");
      return;
    }

    Promise.all([
      fetch(`/api/products/${params.slug}`).then((r) => r.json()),
    ])
      .then(([p]: [WCProduct]) => {
        setProduct(p);
        return fetch(`/api/products/${p.id}/variations`).then((r) => r.json());
      })
      .then((v: WCVariation[]) => setVariations(v))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.slug, router]);

  useEffect(() => {
    if (!selectedSize || !variations.length) return;
    const match = variations.find(
      (v) =>
        v.attributes.some(
          (a) => a.option.toLowerCase() === selectedSize.toLowerCase()
        ) && v.stock_status === "instock"
    );
    setSelectedVariation(match ?? null);
  }, [selectedSize, variations]);

  function addToCart() {
    if (!product) return;
    setAdding(true);

    const existing = JSON.parse(sessionStorage.getItem("sect_cart") || "[]");
    const item = {
      product_id: product.id,
      variation_id: selectedVariation?.id,
      name: product.name,
      price: parseFloat(selectedVariation?.price ?? product.price),
      quantity: 1,
      image: product.images?.[0]?.src,
      attributes: selectedVariation?.attributes,
    };

    // Merge or add
    const idx = existing.findIndex(
      (i: { product_id: number; variation_id?: number }) =>
        i.product_id === item.product_id &&
        i.variation_id === item.variation_id
    );
    if (idx >= 0) {
      existing[idx].quantity += 1;
    } else {
      existing.push(item);
    }

    sessionStorage.setItem("sect_cart", JSON.stringify(existing));
    setTimeout(() => {
      setAdding(false);
      router.push("/cart");
    }, 400);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <span className="text-white/20 text-xs tracking-[0.4em]">—</span>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <span className="text-white/30 text-xs tracking-[0.4em] uppercase">
          Not found
        </span>
      </main>
    );
  }

  const sizes = product.attributes
    .find((a) => a.name.toLowerCase() === "size" || a.name.toLowerCase() === "μέγεθος")
    ?.options ?? [];

  const isInStock = product.stock_status === "instock";
  const canAdd =
    isInStock &&
    (sizes.length === 0 || (selectedVariation?.stock_status === "instock"));

  return (
    <main className="min-h-screen bg-black px-6 py-16">
      <div className="max-w-4xl mx-auto">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="text-[10px] text-white/20 tracking-[0.4em] uppercase hover:text-white/50 transition-colors mb-12 block"
        >
          ← Back
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Images */}
          <div>
            <div className="relative aspect-[3/4] bg-zinc-950 overflow-hidden mb-2">
              {product.images?.[activeImage] ? (
                <Image
                  src={product.images[activeImage].src}
                  alt={product.images[activeImage].alt || product.name}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white/10 text-xs tracking-[0.4em]">—</span>
                </div>
              )}
            </div>

            {/* Thumbnail strip */}
            {product.images.length > 1 && (
              <div className="flex gap-2 mt-2">
                {product.images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImage(i)}
                    className={`relative w-14 aspect-square overflow-hidden transition-opacity ${
                      i === activeImage ? "opacity-100" : "opacity-30 hover:opacity-60"
                    }`}
                  >
                    <Image
                      src={img.src}
                      alt={img.alt || ""}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product info */}
          <div className="flex flex-col justify-between">
            <div>
              <p className="text-xs text-white/25 tracking-[0.4em] uppercase mb-3">
                SWEAT SECT
              </p>
              <h1 className="text-base text-white tracking-[0.2em] uppercase mb-2">
                {product.name}
              </h1>
              <p className="text-sm text-white/50 mb-8">
                €{parseFloat(product.price).toFixed(2)}
              </p>

              {/* Size selector */}
              {sizes.length > 0 && (
                <div className="mb-8">
                  <p className="text-[10px] text-white/30 tracking-[0.4em] uppercase mb-4">
                    Size
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {sizes.map((size) => {
                      const sizeVariation = variations.find(
                        (v) =>
                          v.attributes.some(
                            (a) => a.option.toLowerCase() === size.toLowerCase()
                          )
                      );
                      const outOfStock =
                        sizeVariation &&
                        sizeVariation.stock_status !== "instock";

                      return (
                        <button
                          key={size}
                          onClick={() => !outOfStock && setSelectedSize(size)}
                          disabled={!!outOfStock}
                          className={`
                            text-[11px] tracking-[0.2em] uppercase px-4 py-2 border
                            transition-all duration-150
                            ${
                              selectedSize === size
                                ? "border-white text-white"
                                : outOfStock
                                ? "border-white/10 text-white/15 cursor-not-allowed"
                                : "border-white/20 text-white/50 hover:border-white/50 hover:text-white/80"
                            }
                          `}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Short description */}
              {product.short_description && (
                <div
                  className="text-xs text-white/30 leading-relaxed mb-8 [&_p]:mb-2"
                  dangerouslySetInnerHTML={{ __html: product.short_description }}
                />
              )}
            </div>

            {/* Add to bag */}
            <button
              onClick={addToCart}
              disabled={!canAdd || adding || (sizes.length > 0 && !selectedSize)}
              className="
                text-xs tracking-[0.4em] uppercase py-4 w-full border
                transition-all duration-200
                border-white/20 text-white/60
                hover:border-white/50 hover:text-white
                disabled:opacity-20 disabled:cursor-not-allowed
              "
            >
              {adding
                ? "—"
                : !isInStock
                ? "Sold Out"
                : sizes.length > 0 && !selectedSize
                ? "Select Size"
                : "Add to Bag"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

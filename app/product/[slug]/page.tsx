"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import type { WCProduct, WCVariation } from "@/types";
import { ZoomImage } from "@/components/ZoomImage";
import { GymBar } from "@/components/GymBar";
import { AccordionSection } from "@/components/Accordion";

export const runtime = "edge";

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
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Guard
    if (!localStorage.getItem("sect_code")) {
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
    if (!product) return;
    try {
      const favorites: number[] = JSON.parse(localStorage.getItem("sect_favorites") || "[]");
      setSaved(favorites.includes(product.id));
    } catch {
      // ignore malformed storage
    }
  }, [product]);

  function toggleFavorite() {
    if (!product) return;
    const favorites: number[] = JSON.parse(localStorage.getItem("sect_favorites") || "[]");
    const next = saved
      ? favorites.filter((id) => id !== product.id)
      : [...favorites, product.id];
    localStorage.setItem("sect_favorites", JSON.stringify(next));
    setSaved(!saved);
  }

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
      <main className="min-h-screen bg-white flex items-center justify-center">
        <span className="text-black/20 text-xs tracking-[0.4em]">—</span>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <span className="text-black/30 text-xs tracking-[0.4em] uppercase">
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

  const activePhoto = product.images?.[activeImage];
  const materials = product.meta_data?.find((m) => m.key === "_ss_materials")?.value;
  const care = product.meta_data?.find((m) => m.key === "_ss_care")?.value;

  return (
    <main className="min-h-screen bg-white px-6 py-6">
      <GymBar />
      <div className="max-w-5xl mx-auto pt-6">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="text-sm text-black/40 tracking-[0.05em] uppercase hover:text-black transition-colors mb-10 block"
        >
          ← Back
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Images */}
          <div>
            {activePhoto ? (
              <ZoomImage
                key={activePhoto.id}
                src={activePhoto.src}
                alt={activePhoto.alt || product.name}
                priority
              />
            ) : (
              <div className="relative aspect-[3/4] bg-zinc-50 overflow-hidden mb-2 flex items-center justify-center">
                <span className="text-black/10 text-xs tracking-[0.4em]">—</span>
              </div>
            )}

            {/* Thumbnail strip */}
            {product.images.length > 1 && (
              <div className="flex gap-2 mt-3">
                {product.images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImage(i)}
                    className={`relative w-14 aspect-square overflow-hidden border transition-colors ${
                      i === activeImage
                        ? "border-black"
                        : "border-transparent opacity-50 hover:opacity-100"
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
              <p className="text-xs text-black/40 tracking-[0.3em] uppercase mb-3">
                Sweat Sect
              </p>
              <h1 className="text-2xl text-black mb-3 leading-tight">{product.name}</h1>
              <p className="text-lg text-black/70 font-medium mb-8">
                €{parseFloat(product.price).toFixed(2)}
              </p>

              {/* Size selector */}
              {sizes.length > 0 && (
                <div className="mb-8">
                  <p className="text-xs text-black/40 tracking-[0.2em] uppercase mb-4 font-medium">
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
                            text-sm px-5 py-2.5 border min-w-[52px]
                            transition-all duration-150
                            ${
                              selectedSize === size
                                ? "border-black bg-black text-white"
                                : outOfStock
                                ? "border-black/10 text-black/20 cursor-not-allowed line-through"
                                : "border-black/20 text-black/70 hover:border-black"
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
                  className="text-sm text-black/50 leading-relaxed mb-8 [&_p]:mb-2"
                  dangerouslySetInnerHTML={{ __html: product.short_description }}
                />
              )}
            </div>

            <div>
              {/* Add to bag + wishlist */}
              <div className="flex gap-2 mb-10">
                <button
                  onClick={addToCart}
                  disabled={!canAdd || adding || (sizes.length > 0 && !selectedSize)}
                  className="
                    flex-1 text-sm tracking-[0.1em] uppercase py-4 font-medium
                    transition-all duration-200
                    bg-black text-white
                    hover:bg-black/80
                    disabled:bg-black/10 disabled:text-black/30 disabled:cursor-not-allowed
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
                <button
                  onClick={toggleFavorite}
                  aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
                  className="w-14 flex items-center justify-center border border-black/20 hover:border-black transition-colors"
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
              </div>

              {/* Detail sections */}
              <div className="border-b border-black/10">
                {product.description && (
                  <AccordionSection title="Description" defaultOpen>
                    <div dangerouslySetInnerHTML={{ __html: product.description }} />
                  </AccordionSection>
                )}
                {materials && (
                  <AccordionSection title="Materials & Care">
                    <p>{materials}</p>
                    {care && <p>{care}</p>}
                  </AccordionSection>
                )}
                <AccordionSection title="Pickup at your gym">
                  <p>
                    No shipping, no couriers. Your order is prepared and delivered
                    to your gym&apos;s reception desk in a matte black bag with your
                    name on it. You&apos;ll get an email when it&apos;s ready to collect.
                  </p>
                </AccordionSection>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

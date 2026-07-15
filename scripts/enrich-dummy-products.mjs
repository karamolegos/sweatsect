/**
 * Enrich the SS-DUM-* dummy products so the storefront can be designed
 * against realistic content:
 *   - convert each simple product to a variable product with sizes S–XXL
 *     (one size marked out-of-stock on a few items, to exercise that UI)
 *   - pull 2–3 extra photos from Shopify-based source stores
 *     (Gymshark / Pursue Fitness expose /products/{handle}.json)
 *   - write brand-voice descriptions + materials/care meta
 *
 * Idempotent — safe to re-run; it overwrites the same fields each time.
 *
 * Usage: node scripts/enrich-dummy-products.mjs
 * Reads WC_CONSUMER_KEY / WC_CONSUMER_SECRET from env or .env.local.
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------- env
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
try {
  const envFile = readFileSync(resolve(root, ".env.local"), "utf8");
  for (const line of envFile.split("\n")) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch { /* rely on the environment */ }

const WC_URL = (process.env.WC_URL || process.env.NEXT_PUBLIC_WC_URL || "https://api.sweatsect.com").replace(/\/$/, "");
const AUTH = "Basic " + Buffer.from(`${process.env.WC_CONSUMER_KEY}:${process.env.WC_CONSUMER_SECRET}`).toString("base64");

if (!process.env.WC_CONSUMER_KEY) {
  console.error("Missing WC_CONSUMER_KEY / WC_CONSUMER_SECRET.");
  process.exit(1);
}

async function wc(path, options = {}) {
  const res = await fetch(`${WC_URL}/wp-json/wc/v3${path}`, {
    ...options,
    headers: { Authorization: AUTH, "Content-Type": "application/json", ...(options.headers ?? {}) },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`${options.method || "GET"} ${path} → ${res.status}: ${body?.message || JSON.stringify(body)}`);
  return body;
}

const SIZES = ["S", "M", "L", "XL", "XXL"];

// Per-SKU copy. `oos` = sizes to mark out of stock (UI testing).
// Copy is placeholder-but-plausible, written in the brand voice
// (typography-first, understated, no exclamation marks).
const ENRICH = {
  "SS-DUM-001": {
    desc: "Short-sleeve terry pump cover in a washed ash grey. Cut wide through the chest and shoulders with a dropped seam, so it comes off clean between sets. Heavyweight loopback terry that holds its shape.",
    materials: "80% cotton, 20% polyester loopback terry, 320 GSM. High-density silicone print at chest.",
    care: "Machine wash cold, inside out. Do not tumble dry. Do not iron the print.",
    oos: ["S"],
  },
  "SS-DUM-002": {
    desc: "Knitted hoodie in cement. Structured knit with a soft hand feel — built for the walk in, the warm-up, and everything after. Ribbed cuffs and hem keep the silhouette clean.",
    materials: "55% cotton, 45% acrylic knit, 400 GSM. Tonal embroidery.",
    care: "Hand wash or machine wash wool cycle. Dry flat.",
    oos: [],
  },
  "SS-DUM-003": {
    desc: "Short-sleeve hoodie in slate. The pump cover, evolved — hood up, sleeves out of the way. Oversized fit with a boxy torso that ends past the waistband.",
    materials: "70% cotton, 30% polyester french terry, 300 GSM.",
    care: "Machine wash cold. Hang dry.",
    oos: [],
  },
  "SS-DUM-004": {
    desc: "The oversized tee. Boxy through the torso, dropped shoulders, heavyweight fabric that hangs with structure instead of slouch. Blackout — no visible branding at ten feet.",
    materials: "100% ring-spun cotton, 280 GSM. Pre-shrunk. High-density silicone print.",
    care: "Machine wash cold, inside out. Tumble dry low.",
    oos: ["S", "XXL"],
  },
  "SS-DUM-005": {
    desc: "Heavyweight jogger in pitch grey. Tapered from the knee, cuffed at the ankle, with a deep waistband that stays put. Brushed inside for warmth without bulk.",
    materials: "80% cotton, 20% polyester brushed fleece, 360 GSM. YKK zip pockets.",
    care: "Machine wash cold. Tumble dry low.",
    oos: [],
  },
  "SS-DUM-006": {
    desc: "Training tank in earth. Cut deep at the arms for full range, longer at the hem so it stays tucked under a belt. Lightweight and fast-drying.",
    materials: "90% polyester, 10% elastane performance knit, 160 GSM. Moisture-wicking.",
    care: "Machine wash cold. Hang dry. Do not use fabric softener.",
    oos: [],
  },
  "SS-DUM-007": {
    desc: "Zip-through pump cover in washed brown. Full zip for fast on-off between working sets, ribbed panels at the sides for shape. Garment-washed for a lived-in feel from day one.",
    materials: "75% cotton, 25% polyester loopback, 340 GSM. Garment-washed.",
    care: "Machine wash cold, zipped. Hang dry.",
    oos: ["XL"],
  },
  "SS-DUM-008": {
    desc: "Zip-through pump cover in washed black. Full zip for fast on-off between working sets, ribbed panels at the sides for shape. Garment-washed for a lived-in feel from day one.",
    materials: "75% cotton, 25% polyester loopback, 340 GSM. Garment-washed.",
    care: "Machine wash cold, zipped. Hang dry.",
    oos: [],
  },
  "SS-DUM-009": {
    desc: "Cropped terry hoodie in onyx. Ends above the waistband — built to pair with high-rise leggings. Relaxed through the shoulders with a slightly bloused sleeve.",
    materials: "80% cotton, 20% polyester terry, 300 GSM.",
    care: "Machine wash cold, inside out. Dry flat.",
    oos: [],
  },
  "SS-DUM-010": {
    desc: "Crop hoodie in navy. Everyday weight, soft brushed interior, with a raw-edge hem that keeps the crop line clean. The one you leave at the gym on purpose.",
    materials: "65% cotton, 35% polyester fleece, 280 GSM.",
    care: "Machine wash cold. Tumble dry low.",
    oos: [],
  },
  "SS-DUM-011": {
    desc: "Seamless half-zip in grey marl. Second-skin fit with ventilation zones knitted in — no seams to rub, nothing to adjust. Zip to the collarbone.",
    materials: "68% nylon, 27% polyester, 5% elastane seamless knit.",
    care: "Machine wash cold in a laundry bag. Hang dry.",
    oos: ["S"],
  },
  "SS-DUM-012": {
    desc: "Oversized crop hoodie in washed blue. Big through the body, cropped at the hem — the proportions do the work. Heavy fleece, garment-washed.",
    materials: "80% cotton, 20% polyester fleece, 350 GSM. Garment-washed.",
    care: "Machine wash cold, inside out. Dry flat.",
    oos: [],
  },
  "SS-DUM-013": {
    desc: "Cropped polo in midnight. Knitted collar, three-button placket, cropped square at the hem. Somewhere between the gym and everywhere else.",
    materials: "60% cotton, 40% modal pique knit, 220 GSM.",
    care: "Machine wash cold. Hang dry. Warm iron if needed.",
    oos: [],
  },
  "SS-DUM-014": {
    desc: "Training leggings in black. High-rise with a sculpting waistband, squat-proof compression fabric, and a back drop-in pocket that actually fits a phone.",
    materials: "76% polyester, 24% elastane compression knit. Squat-proof tested.",
    care: "Machine wash cold, inside out. Hang dry. No fabric softener.",
    oos: ["XXL"],
  },
  "SS-DUM-015": {
    desc: "Seamless scrunch shorts in taupe. Mid-rise, contour seams, with a fold-over waistband option. Knitted in one piece — no side seams.",
    materials: "70% nylon, 25% polyester, 5% elastane seamless knit.",
    care: "Machine wash cold in a laundry bag. Hang dry.",
    oos: [],
  },
  "SS-DUM-016": {
    desc: "Parachute pant in cool brown. Technical nylon with a drawstring hem and cargo pocket — loose through the leg, cinched where you want it. Off-duty by design.",
    materials: "100% crinkle nylon shell, brushed tricot pocket bags.",
    care: "Machine wash cold. Hang dry. Cool iron.",
    oos: [],
  },
};

// ------------------------------------------------- Shopify photo enrichment
function shopifyJsonUrl(sourceUrl) {
  try {
    const u = new URL(sourceUrl);
    if (!/gymshark\.com$|pursuefitness\.com$/.test(u.hostname.replace(/^www\.|^eu\./, "").replace(/^(www|eu)\./, "")) &&
        !u.hostname.includes("gymshark.com") && !u.hostname.includes("pursuefitness.com")) return null;
    const m = u.pathname.match(/\/products\/([^/]+)/);
    if (!m) return null;
    return `${u.origin}/products/${m[1]}.json`;
  } catch { return null; }
}

async function fetchExtraImages(sourceUrl, max = 3) {
  const jsonUrl = shopifyJsonUrl(sourceUrl);
  if (!jsonUrl) return [];
  try {
    const res = await fetch(jsonUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) return [];
    const data = await res.json();
    const imgs = (data.product?.images ?? []).map((i) => i.src).filter(Boolean);
    return imgs.slice(0, max);
  } catch { return []; }
}

// ---------------------------------------------------------------- main
async function main() {
  console.log(`Target: ${WC_URL}`);
  const all = await wc("/products?per_page=100&status=any");
  const dummies = all.filter((p) => p.sku?.startsWith("SS-DUM-"));
  console.log(`Found ${dummies.length} dummy products.\n`);

  for (const p of dummies) {
    const cfg = ENRICH[p.sku];
    if (!cfg) { console.log(`  skip ${p.sku} (no enrich config)`); continue; }

    // 1) Extra photos from the Shopify source, if available
    const sourceUrl = p.meta_data?.find((m) => m.key === "_ss_source_url")?.value;
    let images;
    const extra = sourceUrl ? await fetchExtraImages(sourceUrl) : [];
    if (extra.length > 1) {
      // Keep the existing first image (already sideloaded), append the rest
      const existing = p.images?.[0] ? [{ id: p.images[0].id }] : [];
      images = [...existing, ...extra.slice(existing.length ? 1 : 0).map((src) => ({ src }))];
    }

    // 2) Convert to variable product with sizes + rich copy
    const price = p.regular_price || p.price;
    const payload = {
      type: "variable",
      description: `<p>${cfg.desc}</p>`,
      short_description: `<p>${cfg.desc.split(". ")[0]}.</p>`,
      attributes: [
        { name: "Size", visible: true, variation: true, options: SIZES },
      ],
      meta_data: [
        { key: "_ss_materials", value: cfg.materials },
        { key: "_ss_care", value: cfg.care },
      ],
      ...(images ? { images } : {}),
    };

    try {
      await wc(`/products/${p.id}`, { method: "PUT", body: JSON.stringify(payload) });
    } catch (err) {
      // Most likely an image sideload failure — retry without images
      console.warn(`  ⚠ ${p.sku}: ${err.message} — retrying without new images`);
      delete payload.images;
      await wc(`/products/${p.id}`, { method: "PUT", body: JSON.stringify(payload) });
    }

    // 3) Variations — wipe and recreate (idempotent)
    const existingVars = await wc(`/products/${p.id}/variations?per_page=100`);
    if (existingVars.length) {
      await wc(`/products/${p.id}/variations/batch`, {
        method: "POST",
        body: JSON.stringify({ delete: existingVars.map((v) => v.id) }),
      });
    }
    await wc(`/products/${p.id}/variations/batch`, {
      method: "POST",
      body: JSON.stringify({
        create: SIZES.map((size) => ({
          regular_price: price,
          attributes: [{ name: "Size", option: size }],
          stock_status: cfg.oos.includes(size) ? "outofstock" : "instock",
        })),
      }),
    });

    console.log(`  ✓ ${p.sku} ${p.name} — sizes ${SIZES.join("/")}${cfg.oos.length ? ` (OOS: ${cfg.oos.join(",")})` : ""}${images ? `, ${images.length} photos` : ""}`);
  }

  console.log("\nDone.");
}

main().catch((e) => { console.error(e.message); process.exit(1); });

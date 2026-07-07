/**
 * Seed WooCommerce with dummy products taken from the clothes-selection
 * (sourcing) app — placeholder catalog so the storefront can be built and
 * tested end-to-end before real Sweat Sect products exist.
 *
 * Every dummy product gets SKU prefix `SS-DUM-` and meta `_ss_dummy=1`,
 * so they can all be wiped with one command before go-live.
 *
 * Usage:
 *   WC_CONSUMER_KEY=ck_xxx WC_CONSUMER_SECRET=cs_xxx node scripts/seed-dummy-products.mjs
 *   node scripts/seed-dummy-products.mjs --delete   # remove all SS-DUM-* products
 *
 * Reads WC_CONSUMER_KEY / WC_CONSUMER_SECRET (and optional WC_URL) from the
 * environment, falling back to .env.local in the repo root.
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
} catch {
  /* no .env.local — rely on the environment */
}

const WC_URL = (process.env.WC_URL || process.env.NEXT_PUBLIC_WC_URL || "https://api.sweatsect.com").replace(/\/$/, "");
const WC_KEY = process.env.WC_CONSUMER_KEY;
const WC_SECRET = process.env.WC_CONSUMER_SECRET;

if (!WC_KEY || !WC_SECRET) {
  console.error("Missing WC_CONSUMER_KEY / WC_CONSUMER_SECRET (env or .env.local).");
  process.exit(1);
}

const AUTH = "Basic " + Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString("base64");

async function wc(path, options = {}) {
  const res = await fetch(`${WC_URL}/wp-json/wc/v3${path}`, {
    ...options,
    headers: { Authorization: AUTH, "Content-Type": "application/json", ...(options.headers ?? {}) },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = body?.message || JSON.stringify(body);
    throw new Error(`${options.method || "GET"} ${path} → ${res.status}: ${msg}`);
  }
  return body;
}

// ---------------------------------------------------------------- data
// Curated from the sourcing app (Supabase ss-sourcing → items), top-rated /
// feasible reference garments. Display names are genericized to Sweat Sect
// style; the original source stays in meta for traceability.
const DUMMIES = [
  // ---- Men
  { sku: "SS-DUM-001", name: "Terry Pump Cover SS — Ash", price: "55", cats: ["Men", "Hoodies"],
    img: "https://assets.underarmour.gr/media/catalog/product/9/0/90000101_1376997_465_720007113_0_1R91_01_4.jpg?width=1200&height=1200&store=el&image-type=image",
    src: "https://www.underarmour.gr/1376997-ua-rival-terry-ss-hoodie-mployzaki-kontomaniko-under-armour-720007113-0.html" },
  { sku: "SS-DUM-002", name: "Knit Hoodie — Cement", price: "69", cats: ["Men", "Hoodies"],
    img: "https://cdn.shopify.com/s/files/1/1367/5201/files/images-GymsharkxSaaltStudiosKnittedHoodieGSCementBrownGSOatWhiteA2C8O_NC6C_0717_V1.jpg?v=1769768946",
    src: "https://eu.gymshark.com/products/gymshark-x-saalt-studios-knitted-hoodie-pullovers" },
  { sku: "SS-DUM-003", name: "Short Sleeve Hoodie — Slate", price: "49", cats: ["Men", "Hoodies"],
    img: "https://underarmour.scene7.com/is/image/Underarmour/V5-6000581-044_FC?rp=standard-0pad%7CcartFullDesktop&qlt=85&bgc=f0f0f0&wid=1200&hei=1500&op_usm=1.75%2C0.3%2C2%2C0",
    src: "https://www.underarmour.com/en-us/p/ua_meridian_mens_short_sleeve_hoodie/6000581.html?dwvar_6000581_color=044" },
  { sku: "SS-DUM-004", name: "Earned Oversized Tee — Blackout", price: "35", cats: ["Men", "Tees"],
    img: "https://www.pursuefitness.com/cdn/shop/files/core-oversized-t-shirt-black-mens_1024x.jpg?v=1726567883",
    src: "https://www.pursuefitness.com/products/core-oversized-t-shirt-black" },
  { sku: "SS-DUM-005", name: "Heavyweight Jogger — Pitch", price: "59", cats: ["Men", "Bottoms"],
    img: "https://cdn.shopify.com/s/files/1/1367/5201/files/images-PremiumHeavyweightJoggerGSPitchGreyA3C1F_GB7Q_0523_V1b.jpg?v=1763455547",
    src: "https://eu.gymshark.com/products/gymshark-premium-heavyweight-jogger-pants-grey-aw25" },
  { sku: "SS-DUM-006", name: "Balance Tank — Earth", price: "28", cats: ["Men", "Tanks"],
    img: "https://assets.underarmour.gr/media/catalog/product/9/0/90000101_1382703_273_720011529_0_E3T1_01_4.jpg?width=1200&height=1200&store=el&image-type=image",
    src: "https://www.underarmour.gr/1382703-pjt-rck-balance-tank-t-shirt-amaniko-under-armour-720011529-0.html" },
  // ---- Women
  { sku: "SS-DUM-007", name: "Pump Zip Hoodie — Washed Brown", price: "65", cats: ["Women", "Hoodies"],
    img: "https://cdn.shopify.com/s/files/1/1367/5201/files/images-PumpCoverZipThroughHoodieGSCoolBrownWASHB6B5O_NDF3_0568_V2.jpg?v=1769418831",
    src: "https://eu.gymshark.com/products/gymshark-pump-zip-through-hoodie-pullovers" },
  { sku: "SS-DUM-008", name: "Pump Zip Hoodie — Washed Black", price: "65", cats: ["Women", "Hoodies"],
    img: "https://cdn.shopify.com/s/files/1/1367/5201/files/images-PumpCoverZipThroughHoodieGSBlackWASHB6B5O_BC9J_1145_V2.jpg?v=1769428898",
    src: "https://eu.gymshark.com/products/gymshark-pump-zip-through-hoodie-pullovers-black-ss26" },
  { sku: "SS-DUM-009", name: "Icon Crop Hoodie — Onyx", price: "55", cats: ["Women", "Hoodies"],
    img: "https://assets.underarmour.gr/media/catalog/product/9/0/90000101_1389640_001_720016191_0_7393_01_1740015006_1.jpg?width=1200&height=1200&store=el&image-type=image",
    src: "https://www.underarmour.gr/1389640-ua-icon-terry-crop-hoodie-mployza-makrymaniki-under-armour-720016191-0.html" },
  { sku: "SS-DUM-010", name: "Core Crop Hoodie — Navy", price: "52", cats: ["Women", "Hoodies"],
    img: "https://www.pursuefitness.com/cdn/shop/files/15.08.25-2721_1024x.jpg?v=1759758299",
    src: "https://www.pursuefitness.com/products/core-crop-hoodie-navy" },
  { sku: "SS-DUM-011", name: "Seamless Half-Zip — Grey Marl", price: "46", cats: ["Women", "Tops"],
    img: "https://www.pursuefitness.com/cdn/shop/files/core-seamless-crop-12-zip-grey-marl-womens_1024x.jpg?v=1715078083",
    src: "https://www.pursuefitness.com/products/core-seamless-1-2-zip-grey-marl" },
  { sku: "SS-DUM-012", name: "Oversized Crop Hoodie — Washed Blue", price: "54", cats: ["Women", "Hoodies"],
    img: "https://www.pursuefitness.com/cdn/shop/files/oversized-crop-hoodie-washed-blue-womens_1024x.jpg?v=1691671628",
    src: "https://www.pursuefitness.com/products/oversized-crop-hoodie-washed-blue" },
  { sku: "SS-DUM-013", name: "Cropped Polo — Midnight", price: "42", cats: ["Women", "Tops"],
    img: "https://cdn.shopify.com/s/files/1/1367/5201/files/images-GymsharkxAnalisCroppedPoloGSMidnightBlueB4B4H_UB9N_6293.jpg?v=1757511652",
    src: "https://eu.gymshark.com/products/gymshark-gymshark-x-analis-cropped-polo-crop-tops-blue-aw25" },
  { sku: "SS-DUM-014", name: "Launch Leggings — Black", price: "48", cats: ["Women", "Leggings"],
    img: "https://assets.underarmour.gr/media/catalog/product/9/0/90000101_1386351_015_720014480_0_G581_01_2.jpg?width=1200&height=1200&store=el&image-type=image",
    src: "https://www.underarmour.gr/1386351-ua-launch-elite-cw-tights-kolan-under-armour-720014480-0.html" },
  { sku: "SS-DUM-015", name: "Sculpt Scrunch Shorts — Taupe", price: "38", cats: ["Women", "Shorts"],
    img: "https://www.pursuefitness.com/cdn/shop/files/sculpt-seamless-scrunch-shorts-taupe-womens_1024x.jpg?v=1741374141",
    src: "https://www.pursuefitness.com/products/sculpt-seamless-wrap-over-shorts-taupe" },
  { sku: "SS-DUM-016", name: "Parachute Pant — Cool Brown", price: "62", cats: ["Women", "Bottoms"],
    img: "https://cdn.shopify.com/s/files/1/1367/5201/files/images-GorpLifestyleParachutePantGSCoolBrownB5C8M_NBZG_0315_V2.jpg?v=1770213120",
    src: "https://eu.gymshark.com/products/gymshark-weekend-lifestyle-parachute-pant-pants-brown-ss26" },
];

const DESCRIPTION =
  "<p>Placeholder προϊόν για development — reference δείγμα από το sourcing app. " +
  "Δεν είναι προς πώληση· θα αντικατασταθεί από πραγματικό Sweat Sect προϊόν πριν το go-live.</p>";

// ---------------------------------------------------------------- delete mode
async function deleteDummies() {
  const all = await wc("/products?per_page=100&status=any");
  const dummies = all.filter((p) => p.sku?.startsWith("SS-DUM-"));
  if (!dummies.length) return console.log("No SS-DUM-* products found — nothing to delete.");
  for (const p of dummies) {
    await wc(`/products/${p.id}?force=true`, { method: "DELETE" });
    console.log(`  deleted #${p.id} ${p.sku} ${p.name}`);
  }
  console.log(`Deleted ${dummies.length} dummy products.`);
}

// ---------------------------------------------------------------- seed mode
async function ensureCategories(names) {
  const existing = await wc("/products/categories?per_page=100");
  const map = new Map(existing.map((c) => [c.name.toLowerCase(), c.id]));
  for (const name of names) {
    if (!map.has(name.toLowerCase())) {
      const created = await wc("/products/categories", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      map.set(name.toLowerCase(), created.id);
      console.log(`  category created: ${name} (#${created.id})`);
    }
  }
  return map;
}

async function seed() {
  console.log(`Target: ${WC_URL}`);
  const existing = await wc("/products?per_page=100&status=any");
  const existingSkus = new Set(existing.map((p) => p.sku).filter(Boolean));
  console.log(`Store currently has ${existing.length} products.`);

  const catNames = [...new Set(DUMMIES.flatMap((d) => d.cats))];
  const catMap = await ensureCategories(catNames);

  let created = 0, skipped = 0, failed = 0;
  for (const d of DUMMIES) {
    if (existingSkus.has(d.sku)) {
      console.log(`  skip (exists): ${d.sku} ${d.name}`);
      skipped++;
      continue;
    }
    const payload = {
      name: d.name,
      type: "simple",
      sku: d.sku,
      regular_price: d.price,
      description: DESCRIPTION,
      short_description: "<p>Reference sample — dev placeholder.</p>",
      status: "publish",
      stock_status: "instock",
      categories: d.cats.map((c) => ({ id: catMap.get(c.toLowerCase()) })),
      images: [{ src: d.img, alt: d.name }],
      meta_data: [
        { key: "_ss_dummy", value: "1" },
        { key: "_ss_source_url", value: d.src },
      ],
    };
    try {
      const p = await wc("/products", { method: "POST", body: JSON.stringify(payload) });
      console.log(`  created #${p.id} ${d.sku} ${d.name} €${d.price}`);
      created++;
    } catch (err) {
      // Most common failure: WP cannot sideload the remote image. Retry bare.
      console.warn(`  ⚠ image/sideload issue on ${d.sku}: ${err.message}`);
      try {
        const p = await wc("/products", { method: "POST", body: JSON.stringify({ ...payload, images: [] }) });
        console.log(`  created #${p.id} ${d.sku} ${d.name} (WITHOUT image — add manually)`);
        created++;
      } catch (err2) {
        console.error(`  ✗ failed ${d.sku}: ${err2.message}`);
        failed++;
      }
    }
  }
  console.log(`\nDone. created=${created} skipped=${skipped} failed=${failed}`);
  console.log("Wipe before go-live with: node scripts/seed-dummy-products.mjs --delete");
}

if (process.argv.includes("--delete")) {
  deleteDummies().catch((e) => { console.error(e.message); process.exit(1); });
} else {
  seed().catch((e) => { console.error(e.message); process.exit(1); });
}

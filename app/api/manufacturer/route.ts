import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getProducts } from "@/lib/woocommerce";

export const runtime = "edge";

// Server-side Supabase with service role (bypasses RLS for manufacturer writes)
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key);
}

// Simple shared secret to protect this route — set MANUFACTURER_SECRET in your env
function isAuthorized(req: NextRequest) {
  const secret = req.headers.get("x-manufacturer-secret");
  return secret === process.env.MANUFACTURER_SECRET;
}

// GET /api/manufacturer — returns all products + any existing reviews
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  // Fetch WooCommerce products
  const products = await getProducts();

  // Fetch all existing reviews
  const { data: reviews } = await supabase
    .from("manufacturer_reviews")
    .select("product_id, feasibility, notes, updated_at");

  const reviewMap = Object.fromEntries(
    (reviews ?? []).map((r) => [r.product_id, r])
  );

  const enriched = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    image: p.images?.[0]?.src ?? null,
    review: reviewMap[p.id] ?? null,
  }));

  return NextResponse.json(enriched);
}

// POST /api/manufacturer — upsert a review for one product
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { product_id, product_name, feasibility, notes } = body;

  if (!product_id || !feasibility) {
    return NextResponse.json(
      { error: "product_id and feasibility are required" },
      { status: 400 }
    );
  }

  const valid = ["yes", "maybe", "no"];
  if (!valid.includes(feasibility)) {
    return NextResponse.json(
      { error: "feasibility must be yes | maybe | no" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("manufacturer_reviews")
    .upsert(
      {
        product_id,
        product_name: product_name ?? String(product_id),
        feasibility,
        notes: notes ?? null,
      },
      { onConflict: "product_id" }
    )
    .select()
    .single();

  if (error) {
    console.error("[manufacturer] upsert error", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

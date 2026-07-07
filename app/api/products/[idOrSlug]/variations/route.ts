import { type NextRequest, NextResponse } from "next/server";
import { getVariations } from "@/lib/woocommerce";

export const runtime = "edge";

export async function GET(
  _req: NextRequest,
  // Named idOrSlug to match /api/products/[idOrSlug] (Next.js requires one
  // dynamic-segment name per level); this endpoint treats it as an id.
  { params }: { params: Promise<{ idOrSlug: string }> }
) {
  try {
    const { idOrSlug: id } = await params;
    const variations = await getVariations(parseInt(id, 10));
    return NextResponse.json(variations);
  } catch (err) {
    console.error("[api/products/[idOrSlug]/variations]", err);
    return NextResponse.json([], { status: 500 });
  }
}

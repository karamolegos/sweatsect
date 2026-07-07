import { type NextRequest, NextResponse } from "next/server";
import { getProduct } from "@/lib/woocommerce";

export const runtime = "edge";

export async function GET(
  _req: NextRequest,
  // Named idOrSlug because Next.js requires one dynamic-segment name across
  // /api/products/* ('slug' here clashed with '[id]/variations'); this
  // endpoint treats it as a slug.
  { params }: { params: Promise<{ idOrSlug: string }> }
) {
  try {
    const { idOrSlug: slug } = await params;
    const product = await getProduct(slug);
    return NextResponse.json(product);
  } catch (err) {
    console.error("[api/products/[idOrSlug]]", err);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

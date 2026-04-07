import { type NextRequest, NextResponse } from "next/server";
import { getProduct } from "@/lib/woocommerce";

export const runtime = "edge";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const product = await getProduct(slug);
    return NextResponse.json(product);
  } catch (err) {
    console.error("[api/products/[slug]]", err);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

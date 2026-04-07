import { type NextRequest, NextResponse } from "next/server";
import { getVariations } from "@/lib/woocommerce";

export const runtime = "edge";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const variations = await getVariations(parseInt(id, 10));
    return NextResponse.json(variations);
  } catch (err) {
    console.error("[api/products/[id]/variations]", err);
    return NextResponse.json([], { status: 500 });
  }
}

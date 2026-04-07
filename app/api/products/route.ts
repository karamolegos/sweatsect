import { NextResponse } from "next/server";
import { getProducts } from "@/lib/woocommerce";

export const runtime = "edge";

export async function GET() {
  try {
    const products = await getProducts();
    return NextResponse.json(products);
  } catch (err) {
    console.error("[api/products]", err);
    return NextResponse.json([], { status: 500 });
  }
}

import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getOrdersByUserId } from "@/lib/woocommerce";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const jwt = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!jwt) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(jwt);

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const orders = await getOrdersByUserId(user.id);

    // Slim payload — only what the account page shows
    const slim = orders.map((o) => ({
      id: o.id,
      number: o.number,
      status: o.status,
      total: o.total,
      date_created: o.date_created,
      line_items: o.line_items.map((li) => ({
        name: li.name,
        quantity: li.quantity,
        total: li.total,
        image: li.image,
      })),
    }));

    return NextResponse.json(slim);
  } catch (err) {
    console.error("[my-orders]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

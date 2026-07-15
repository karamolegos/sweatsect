import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export const runtime = "edge";

/**
 * The partner "session" is just the PIN itself, sent on every request — no
 * token/cookie system. Re-validating against the gyms table each call means
 * we never trust a client-supplied gym_id; the PIN is the only credential
 * that can produce one. Fine for this scale (a handful of gym owners).
 */
export async function GET(req: NextRequest) {
  try {
    const pin = req.headers.get("x-partner-pin");
    if (!pin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServerClient();
    const { data: gym, error: gymError } = await supabase
      .from("gyms")
      .select("id, name, commission_rate")
      .eq("portal_pin", pin.trim())
      .eq("active", true)
      .single();

    if (gymError || !gym) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: commissions, error: commError } = await supabase
      .from("commissions")
      .select("id, order_id, amount, status, created_at")
      .eq("gym_id", gym.id)
      .order("created_at", { ascending: false });

    if (commError) {
      console.error("[partner/stats] commissions query", commError);
      return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }

    const rows = commissions ?? [];
    const totalSales = rows.reduce((sum, c) => sum + Number(c.amount) / gym.commission_rate, 0);
    const totalCommission = rows.reduce((sum, c) => sum + Number(c.amount), 0);
    const pendingCommission = rows
      .filter((c) => c.status === "pending")
      .reduce((sum, c) => sum + Number(c.amount), 0);
    const paidCommission = rows
      .filter((c) => c.status === "paid")
      .reduce((sum, c) => sum + Number(c.amount), 0);

    return NextResponse.json({
      gym_name: gym.name,
      commission_rate: gym.commission_rate,
      summary: {
        order_count: rows.length,
        total_sales: Math.round(totalSales * 100) / 100,
        total_commission: Math.round(totalCommission * 100) / 100,
        pending_commission: Math.round(pendingCommission * 100) / 100,
        paid_commission: Math.round(paidCommission * 100) / 100,
      },
      // No customer PII — order_id, amount, status, date only
      orders: rows.map((c) => ({
        order_id: c.order_id,
        amount: c.amount,
        status: c.status,
        created_at: c.created_at,
      })),
    });
  } catch (err) {
    console.error("[partner/stats]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

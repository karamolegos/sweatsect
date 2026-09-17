/**
 * Called by /confirmed once Stripe redirects back with redirect_status=succeeded.
 * The redirect status is client-supplied and not trustworthy on its own, so
 * this re-checks the PaymentIntent server-side before touching the order.
 *
 * Moves the WC order from "pending" to "processing", which is what makes
 * WooCommerce fire its order.updated webhook again — that second delivery
 * (now carrying the real status) is what /api/order-complete needs to write
 * the commission. Nothing upstream of this route ever made that transition.
 */

import { type NextRequest, NextResponse } from "next/server";
import { updateOrder } from "@/lib/woocommerce";

export const runtime = "edge";

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY!;

export async function POST(req: NextRequest) {
  try {
    const { payment_intent_id } = (await req.json()) as {
      payment_intent_id?: string;
    };
    if (!payment_intent_id) {
      return NextResponse.json({ error: "Missing payment_intent_id" }, { status: 400 });
    }

    const res = await fetch(
      `https://api.stripe.com/v1/payment_intents/${payment_intent_id}`,
      { headers: { Authorization: `Bearer ${STRIPE_SECRET}` } }
    );
    if (!res.ok) {
      return NextResponse.json({ error: "Stripe lookup failed" }, { status: 502 });
    }
    const pi = (await res.json()) as {
      status: string;
      metadata?: { wc_order_id?: string };
    };

    if (pi.status !== "succeeded") {
      return NextResponse.json({ ok: false, reason: "not_succeeded" });
    }

    const orderId = pi.metadata?.wc_order_id;
    if (!orderId) {
      return NextResponse.json({ ok: false, reason: "no_order_id" });
    }

    await updateOrder(Number(orderId), { status: "processing" });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[confirm-order]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

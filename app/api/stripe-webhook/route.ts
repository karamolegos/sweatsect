/**
 * Stripe webhook: payment_intent.succeeded
 *
 * The order only leaves "pending" when someone tells WooCommerce the money
 * arrived, and that transition is what makes WooCommerce fire the delivery
 * that writes the commission. /api/confirm-order does it from the browser,
 * but only if the customer actually lands on /confirmed — close the tab
 * during the redirect and the sale is never credited to the gym.
 *
 * This route is the path that does not depend on the customer's browser.
 */

import { type NextRequest, NextResponse } from "next/server";
import { verifyStripeWebhook } from "@/lib/stripe";
import { getOrder, updateOrder } from "@/lib/woocommerce";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }
  if (!signature || !(await verifyStripeWebhook(rawBody, signature, secret))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const event = JSON.parse(rawBody) as {
      type: string;
      data: { object: { id: string; metadata?: { wc_order_id?: string } } };
    };

    if (event.type !== "payment_intent.succeeded") {
      return NextResponse.json({ ok: true, ignored: event.type });
    }

    const orderId = event.data.object.metadata?.wc_order_id;
    if (!orderId) {
      console.warn(
        `[stripe-webhook] no wc_order_id on ${event.data.object.id}`
      );
      return NextResponse.json({ ok: true, warning: "no_order_id" });
    }

    // Stripe retries, and /api/confirm-order may have already run. Only ever
    // move a pending order forward — never drag a completed one back.
    const order = await getOrder(Number(orderId));
    if (order.status !== "pending") {
      return NextResponse.json({ ok: true, already: order.status });
    }

    await updateOrder(Number(orderId), { status: "processing" });
    return NextResponse.json({ ok: true, order_id: Number(orderId) });
  } catch (err) {
    // 500 so Stripe retries — a lost event here means an uncredited gym.
    console.error("[stripe-webhook]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

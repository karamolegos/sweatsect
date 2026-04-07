import { type NextRequest, NextResponse } from "next/server";
import { createPaymentIntent } from "@/lib/stripe";
import { createOrder } from "@/lib/woocommerce";
import type { CartItem } from "@/types";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const { items, email, gym_id, user_id } = (await req.json()) as {
      items: CartItem[];
      email: string;
      gym_id: string;
      user_id: string;
    };

    if (!items?.length || !email || !gym_id) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // 1. Create WooCommerce order (status: pending)
    const wcOrder = await createOrder({
      status: "pending",
      billing: { email, first_name: "", last_name: "" },
      line_items: items.map((item) => ({
        product_id: item.product_id,
        variation_id: item.variation_id,
        quantity: item.quantity,
      })),
      meta_data: [
        { key: "_gym_id", value: gym_id },
        { key: "_user_id", value: user_id },
        { key: "_payment_method", value: "stripe" },
      ],
    });

    // 2. Create Stripe PaymentIntent
    const totalCents = Math.round(
      items.reduce((sum, i) => sum + i.price * i.quantity, 0) * 100
    );

    const pi = await createPaymentIntent({
      amount: totalCents,
      currency: "eur",
      metadata: {
        wc_order_id: wcOrder.id.toString(),
        gym_id,
        user_id,
      },
    });

    return NextResponse.json({
      client_secret: pi.client_secret,
      order_id: wcOrder.id,
    });
  } catch (err) {
    console.error("[create-payment-intent]", err);
    return NextResponse.json({ error: "Payment setup failed" }, { status: 500 });
  }
}

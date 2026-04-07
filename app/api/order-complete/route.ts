/**
 * WooCommerce webhook: order.completed
 * This is the commission ledger writer. If this fails, we lose commission data.
 * It is intentionally minimal — one DB write, one email, nothing else.
 * Email: Brevo (sweatsect.com sender domain, free tier)
 */

import { type NextRequest, NextResponse } from "next/server";
import { getUserGym, writeCommission } from "@/lib/supabase";
import type { WCOrderWebhook } from "@/types";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    // WooCommerce sends webhook signature in header
    const secret = req.headers.get("x-wc-webhook-secret");
    if (secret !== process.env.WC_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const order = (await req.json()) as WCOrderWebhook;

    // Only process completed/processing orders
    if (order.status !== "completed" && order.status !== "processing") {
      return NextResponse.json({ ok: true, skipped: true });
    }

    // Find gym_id from order meta (set during create-payment-intent)
    const gymMeta = order.meta_data?.find((m) => m.key === "_gym_id");
    const userMeta = order.meta_data?.find((m) => m.key === "_user_id");

    let gym_id = gymMeta?.value;

    // Fallback: look up from Supabase profiles via user_id
    if (!gym_id && userMeta?.value) {
      const profile = await getUserGym(userMeta.value);
      gym_id = profile?.gym_id;
    }

    if (!gym_id) {
      console.warn(`[order-complete] No gym_id for order ${order.id}`);
      return NextResponse.json({ ok: true, warning: "no_gym_id" });
    }

    // Write commission (20% — Phase 2 will read per-gym rate from Supabase)
    const orderTotal = parseFloat(order.total);
    const commissionAmount = Math.round(orderTotal * 0.20 * 100) / 100;

    await writeCommission({
      order_id: order.id,
      gym_id,
      amount: commissionAmount,
    });

    // Send confirmation email via Brevo
    try {
      await sendBrevoEmail({
        to: order.billing.email,
        toName: `${order.billing.first_name} ${order.billing.last_name}`.trim() || "Member",
        subject: `Order #${order.number} confirmed — SWEAT SECT`,
        html: buildConfirmationEmail(order),
      });
    } catch (emailErr) {
      // Don't fail the webhook if email fails — commission is already written
      console.error("[order-complete] Email failed:", emailErr);
    }

    return NextResponse.json({ ok: true, commission: commissionAmount });
  } catch (err) {
    console.error("[order-complete]", err);
    // Return 200 so WooCommerce doesn't keep retrying on non-critical errors
    return NextResponse.json({ ok: false, error: String(err) });
  }
}

async function sendBrevoEmail({
  to,
  toName,
  subject,
  html,
}: {
  to: string;
  toName: string;
  subject: string;
  html: string;
}) {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY!,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: "SWEAT SECT", email: "orders@sweatsect.com" },
      to: [{ email: to, name: toName }],
      subject,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Brevo error ${res.status}: ${err}`);
  }
}

function buildConfirmationEmail(order: WCOrderWebhook): string {
  const items = order.line_items
    .map(
      (i) => `<tr>
      <td style="padding:8px 0;border-bottom:1px solid #111;color:#fff;">${i.name}</td>
      <td style="padding:8px 0;border-bottom:1px solid #111;color:#fff;text-align:right;">×${i.quantity}</td>
      <td style="padding:8px 0;border-bottom:1px solid #111;color:#fff;text-align:right;">€${parseFloat(i.total).toFixed(2)}</td>
    </tr>`
    )
    .join("");

  return `
    <div style="background:#000;color:#fff;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;padding:48px 32px;max-width:480px;margin:0 auto;">
      <p style="letter-spacing:0.4em;font-size:11px;text-transform:uppercase;opacity:0.4;margin-bottom:32px;">SWEAT SECT</p>
      <p style="letter-spacing:0.2em;font-size:13px;text-transform:uppercase;margin-bottom:24px;">Order Confirmed</p>
      <p style="color:#888;font-size:12px;letter-spacing:0.1em;margin-bottom:32px;">#${order.number}</p>

      <table style="width:100%;border-collapse:collapse;margin-bottom:32px;font-size:13px;">
        ${items}
      </table>

      <p style="font-size:13px;letter-spacing:0.1em;">Total: <strong>€${parseFloat(order.total).toFixed(2)}</strong></p>

      <p style="color:#555;font-size:11px;letter-spacing:0.1em;margin-top:48px;border-top:1px solid #111;padding-top:24px;">
        Your order will be ready for pickup at your gym's reception desk within 48 hours.
      </p>
    </div>
  `;
}

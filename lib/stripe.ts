/**
 * Stripe server-side helper.
 * Uses fetch-based approach — compatible with Cloudflare Edge runtime.
 * Do NOT import 'stripe' Node.js SDK in Edge routes (it uses Node crypto).
 */

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY!;

export async function createPaymentIntent(params: {
  amount: number; // in cents
  currency?: string;
  metadata?: Record<string, string>;
}): Promise<{ client_secret: string; id: string }> {
  const body = new URLSearchParams({
    amount: params.amount.toString(),
    currency: params.currency ?? "eur",
    "automatic_payment_methods[enabled]": "true",
    ...(params.metadata
      ? Object.fromEntries(
          Object.entries(params.metadata).map(([k, v]) => [
            `metadata[${k}]`,
            v,
          ])
        )
      : {}),
  });

  const res = await fetch("https://api.stripe.com/v1/payment_intents", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.json() as { error: { message: string } };
    throw new Error(`Stripe error: ${err.error.message}`);
  }

  const pi = await res.json() as { client_secret: string; id: string };
  return { client_secret: pi.client_secret, id: pi.id };
}

// Verify webhook signature (Edge-compatible using crypto.subtle)
export async function verifyStripeWebhook(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const parts = signature.split(",").reduce(
      (acc, part) => {
        const [key, val] = part.split("=");
        if (key === "t") acc.timestamp = val;
        if (key === "v1") acc.v1 = val;
        return acc;
      },
      { timestamp: "", v1: "" }
    );

    const signedPayload = `${parts.timestamp}.${payload}`;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(signedPayload)
    );
    const computed = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return computed === parts.v1;
  } catch {
    return false;
  }
}

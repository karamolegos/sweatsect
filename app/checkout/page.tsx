"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import type { CartItem } from "@/types";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export default function CheckoutPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [emailLocked, setEmailLocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const code = sessionStorage.getItem("sect_code");
    if (!code) { router.replace("/"); return; }

    const cart = JSON.parse(sessionStorage.getItem("sect_cart") || "[]") as CartItem[];
    if (!cart.length) { router.replace("/cart"); return; }
    setItems(cart);
  }, [router]);

  async function initPayment() {
    if (!email || !items.length) return;
    setLoading(true);
    setError("");

    try {
      const gymId = sessionStorage.getItem("sect_gym_id") || "unknown";
      const userId = sessionStorage.getItem("sect_user_id") || "guest";

      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, email, gym_id: gymId, user_id: userId }),
      });

      const data = (await res.json()) as {
        client_secret?: string;
        order_id?: number;
        error?: string;
      };

      if (!data.client_secret) throw new Error(data.error ?? "Failed to init payment");

      if (data.order_id) {
        sessionStorage.setItem("sect_order_id", data.order_id.toString());
      }

      setClientSecret(data.client_secret);
      setEmailLocked(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <main className="min-h-screen bg-black px-6 py-16">
      <div className="max-w-md mx-auto">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="text-[10px] text-white/20 tracking-[0.4em] uppercase hover:text-white/50 transition-colors mb-12 block"
        >
          ← Back
        </button>

        <p className="text-[10px] text-white/25 tracking-[0.5em] uppercase mb-10">
          Payment
        </p>

        {/* Order summary */}
        <div className="mb-8 space-y-2">
          {items.map((item) => (
            <div
              key={`${item.product_id}-${item.variation_id ?? 0}`}
              className="flex justify-between"
            >
              <p className="text-xs text-white/40 tracking-[0.1em]">
                {item.name}
                {item.attributes?.map((a) => ` / ${a.option}`).join("")}
                {item.quantity > 1 && ` ×${item.quantity}`}
              </p>
              <p className="text-xs text-white/40">
                €{(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
          ))}
          <div className="flex justify-between border-t border-white/10 pt-3 mt-3">
            <p className="text-xs text-white/60 tracking-[0.2em] uppercase">Total</p>
            <p className="text-xs text-white">€{total.toFixed(2)}</p>
          </div>
        </div>

        {/* Email */}
        {!emailLocked ? (
          <div className="mb-8">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="
                w-full bg-transparent border-b border-white/20
                text-white text-sm tracking-[0.1em]
                placeholder:text-white/20
                py-3 mb-6 focus:border-white/60 focus:outline-none transition-colors
              "
            />
            {error && (
              <p className="text-xs text-red-500/70 tracking-[0.2em] mb-4">{error}</p>
            )}
            <button
              onClick={initPayment}
              disabled={loading || !email.includes("@")}
              className="
                w-full text-xs tracking-[0.4em] uppercase py-4 border
                border-white/20 text-white/60
                hover:border-white/50 hover:text-white
                disabled:opacity-20 disabled:cursor-not-allowed
                transition-all duration-200
              "
            >
              {loading ? "—" : "Continue to Payment"}
            </button>
          </div>
        ) : clientSecret ? (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: "night",
                variables: {
                  colorBackground: "#000000",
                  colorText: "#ffffff",
                  colorTextPlaceholder: "#444444",
                  borderRadius: "0px",
                  colorPrimary: "#ffffff",
                  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                },
                rules: {
                  ".Input": {
                    border: "none",
                    borderBottom: "1px solid rgba(255,255,255,0.2)",
                    boxShadow: "none",
                    padding: "12px 0",
                  },
                  ".Input:focus": {
                    borderBottom: "1px solid rgba(255,255,255,0.6)",
                    boxShadow: "none",
                  },
                  ".Label": {
                    fontSize: "10px",
                    letterSpacing: "0.3em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.3)",
                  },
                },
              },
            }}
          >
            <CheckoutForm email={email} />
          </Elements>
        ) : null}
      </div>
    </main>
  );
}

function CheckoutForm({ email }: { email: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError("");

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/confirmed`,
        receipt_email: email,
      },
    });

    if (error) {
      setError(error.message ?? "Payment failed.");
      setSubmitting(false);
    }
    // On success, Stripe redirects to /confirmed
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      {error && (
        <p className="text-xs text-red-500/70 tracking-[0.2em]">{error}</p>
      )}
      <button
        type="submit"
        disabled={submitting || !stripe}
        className="
          w-full text-xs tracking-[0.4em] uppercase py-4 mt-4 border
          border-white/20 text-white/60
          hover:border-white/50 hover:text-white
          disabled:opacity-20 disabled:cursor-not-allowed
          transition-all duration-200
        "
      >
        {submitting ? "—" : "Pay Now"}
      </button>
    </form>
  );
}

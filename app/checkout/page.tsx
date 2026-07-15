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
import { GymBar } from "@/components/GymBar";
import { createBrowserClient } from "@/lib/supabase";

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
    const code = localStorage.getItem("sect_code");
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
      const gymId = localStorage.getItem("sect_gym_id") || "unknown";
      // Empty when browsing as a guest (no account required to buy) — order
      // history on /account only shows up for signed-in purchases.
      const supabase = createBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user.id ?? "";

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
    <main className="min-h-screen bg-white px-6 py-6">
      <GymBar />
      <div className="max-w-md mx-auto pt-10">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="text-sm text-black/40 tracking-[0.05em] uppercase hover:text-black transition-colors mb-12 block"
        >
          ← Back
        </button>

        <p className="text-base text-black tracking-[0.15em] uppercase mb-10 font-medium">
          Payment
        </p>

        {/* Order summary */}
        <div className="mb-8 space-y-2">
          {items.map((item) => (
            <div
              key={`${item.product_id}-${item.variation_id ?? 0}`}
              className="flex justify-between"
            >
              <p className="text-sm text-black/60">
                {item.name}
                {item.attributes?.map((a) => ` / ${a.option}`).join("")}
                {item.quantity > 1 && ` ×${item.quantity}`}
              </p>
              <p className="text-sm text-black/60">
                €{(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
          ))}
          <div className="flex justify-between border-t border-black/10 pt-3 mt-3">
            <p className="text-sm text-black/70 uppercase">Total</p>
            <p className="text-base text-black font-medium">€{total.toFixed(2)}</p>
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
                w-full bg-transparent border-b border-black/20
                text-black text-base
                placeholder:text-black/30
                py-3 mb-6 focus:border-black/60 focus:outline-none transition-colors
              "
            />
            {error && (
              <p className="text-sm text-red-600 mb-4">{error}</p>
            )}
            <button
              onClick={initPayment}
              disabled={loading || !email.includes("@")}
              className="
                w-full text-sm tracking-[0.1em] uppercase py-4 font-medium
                bg-black text-white
                hover:bg-black/80
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
                theme: "stripe",
                variables: {
                  colorBackground: "#ffffff",
                  colorText: "#000000",
                  colorTextPlaceholder: "#999999",
                  borderRadius: "0px",
                  colorPrimary: "#000000",
                  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                },
                rules: {
                  ".Input": {
                    border: "none",
                    borderBottom: "1px solid rgba(0,0,0,0.2)",
                    boxShadow: "none",
                    padding: "12px 0",
                  },
                  ".Input:focus": {
                    borderBottom: "1px solid rgba(0,0,0,0.6)",
                    boxShadow: "none",
                  },
                  ".Label": {
                    fontSize: "10px",
                    letterSpacing: "0.3em",
                    textTransform: "uppercase",
                    color: "rgba(0,0,0,0.4)",
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
        <p className="text-sm text-red-600">{error}</p>
      )}
      <button
        type="submit"
        disabled={submitting || !stripe}
        className="
          w-full text-sm tracking-[0.1em] uppercase py-4 mt-4 font-medium
          bg-black text-white
          hover:bg-black/80
          disabled:opacity-20 disabled:cursor-not-allowed
          transition-all duration-200
        "
      >
        {submitting ? "—" : "Pay Now"}
      </button>
    </form>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ConfirmedContent() {
  const searchParams = useSearchParams();
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    // Clear cart on confirmed
    sessionStorage.removeItem("sect_cart");
    setCleared(true);
  }, []);

  const paymentIntent = searchParams.get("payment_intent");
  const status = searchParams.get("redirect_status");
  const success = status === "succeeded";

  if (!cleared) return null;

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
      {success ? (
        <>
          {/* Success mark */}
          <div className="mb-12">
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="20" cy="20" r="19" stroke="white" strokeWidth="0.75" />
              <path
                d="M12 20 L17.5 25.5 L28 15"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <p className="text-xs text-white/30 tracking-[0.4em] uppercase mb-4 text-center">
            Order Confirmed
          </p>
          <p className="text-[10px] text-white/15 tracking-[0.3em] text-center mb-12">
            You&apos;ll receive a confirmation email shortly.
          </p>

          <div className="text-center">
            <p className="text-xs text-white/20 tracking-[0.2em] mb-6 max-w-xs mx-auto">
              Your order will be ready for pickup at your gym&apos;s reception desk in a matte black bag.
            </p>

            <a
              href="/vault"
              className="text-[10px] text-white/20 tracking-[0.4em] uppercase hover:text-white/50 transition-colors"
            >
              Back to Vault
            </a>
          </div>

          {/* Order ref */}
          {paymentIntent && (
            <p className="absolute bottom-8 text-[10px] text-white/8 tracking-[0.2em]">
              {paymentIntent.slice(-8).toUpperCase()}
            </p>
          )}
        </>
      ) : (
        <>
          <p className="text-xs text-white/30 tracking-[0.4em] uppercase mb-4">
            Payment Incomplete
          </p>
          <a
            href="/checkout"
            className="text-[10px] text-white/20 tracking-[0.4em] uppercase hover:text-white/50 transition-colors"
          >
            Try Again
          </a>
        </>
      )}
    </main>
  );
}

export default function ConfirmedPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-black flex items-center justify-center">
          <span className="text-white/20 text-xs tracking-[0.4em]">—</span>
        </main>
      }
    >
      <ConfirmedContent />
    </Suspense>
  );
}

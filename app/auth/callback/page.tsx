"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase";

type Stage = "loading" | "locking" | "error";

export default function CallbackPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function handleCallback() {
      const supabase = createBrowserClient();

      // Implicit flow: Supabase auto-detects the #access_token in the URL
      // and populates the session. We just need to read it.
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        setErrorMsg("Link expired or invalid. Please request a new one.");
        setStage("error");
        return;
      }

      setStage("locking");

      // Get gym_id from localStorage (set when they entered the code)
      const gymId = localStorage.getItem("sect_gym_id");

      if (gymId) {
        // Lock user to gym (idempotent — safe for returning users)
        try {
          await fetch("/api/auth/lock-gym", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ gym_id: gymId }),
          });
        } catch {
          // Non-fatal: user can still access vault, commission tracking may miss
          console.warn("[callback] lock-gym failed, continuing anyway");
        }
      }

      // Ensure sect_code is in sessionStorage for vault guard
      if (!sessionStorage.getItem("sect_code")) {
        // Returning user who clicked link from email on a fresh tab:
        // fetch their gym from profiles and restore the code
        const { data: profile } = await supabase
          .from("profiles")
          .select("gym_id, gyms(code)")
          .eq("user_id", session.user.id)
          .single();

        if (profile?.gyms) {
          const g = profile.gyms as { code: string };
          sessionStorage.setItem("sect_code", g.code);
        }
      }

      // Clean up localStorage gym info (no longer needed)
      localStorage.removeItem("sect_gym_id");
      localStorage.removeItem("sect_gym_name");

      router.replace("/vault");
    }

    handleCallback();
  }, [router]);

  if (stage === "error") {
    return (
      <main className="min-h-screen bg-black flex flex-col items-center justify-center px-6 page-in">
        <p className="text-[10px] text-white/25 tracking-[0.5em] uppercase mb-6">
          Link expired
        </p>
        <p className="text-xs text-white/30 tracking-[0.15em] text-center mb-10">
          {errorMsg}
        </p>
        <a
          href="/"
          className="text-[10px] text-white/20 tracking-[0.4em] uppercase hover:text-white/40 transition-colors"
        >
          Start over
        </a>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
      <span className="text-white/20 text-xs tracking-[0.4em] uppercase">—</span>
    </main>
  );
}

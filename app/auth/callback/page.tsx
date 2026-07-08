"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

      // Implicit flow (email link) auto-populates the session from the URL
      // fragment; OAuth (Google) redirect does the same via the PKCE code
      // exchange. Either way, by the time this runs the session is ready.
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

      // Set at gym-code entry (signup) or at /login (returning member).
      // localStorage (not sessionStorage) so it survives the magic-link
      // email being opened in a different tab, or the OAuth redirect.
      const intent = localStorage.getItem("sect_auth_intent");
      const gymId = localStorage.getItem("sect_gym_id");

      if (intent === "signup" && gymId) {
        // Lock user to the gym they entered the code for (idempotent —
        // safe even if they somehow replay this step).
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

        // sect_code / sect_gym_name were already set at gym-code entry and
        // persist in localStorage — nothing else to restore here.
        localStorage.removeItem("sect_auth_intent");
        router.replace("/vault");
        return;
      }

      // Returning-member login (or signup intent lost, e.g. cleared
      // localStorage mid-flow) — only allowed if they already have a
      // locked gym on file. No profile = never signed up via a gym code =
      // reject, even though Supabase has already created the auth user
      // (unavoidable for Google — there's no "don't create" flag for OAuth).
      const { data: profile } = await supabase
        .from("profiles")
        .select("gym_id, gyms(code, name)")
        .eq("user_id", session.user.id)
        .single();

      // supabase-js types joined relations as array; runtime returns object
      // for a to-one FK — handle both shapes
      const gym = (Array.isArray(profile?.gyms) ? profile?.gyms[0] : profile?.gyms) as
        | { code: string; name: string }
        | undefined;

      if (gym?.code) {
        localStorage.setItem("sect_code", gym.code);
        localStorage.setItem("sect_gym_name", gym.name);
        if (profile?.gym_id) localStorage.setItem("sect_gym_id", profile.gym_id);
        localStorage.removeItem("sect_auth_intent");
        router.replace("/vault");
        return;
      }

      // No profile — reject and sign out so no half-authenticated state lingers
      await supabase.auth.signOut();
      localStorage.removeItem("sect_auth_intent");
      router.replace("/?error=signup_required");
    }

    handleCallback();
  }, [router]);

  if (stage === "error") {
    return (
      <main className="min-h-screen bg-white flex flex-col items-center justify-center px-6 page-in">
        <p className="text-[10px] text-black/40 tracking-[0.5em] uppercase mb-6">
          Link expired
        </p>
        <p className="text-xs text-black/50 tracking-[0.15em] text-center mb-10">
          {errorMsg}
        </p>
        <Link
          href="/"
          className="text-[10px] text-black/30 tracking-[0.4em] uppercase hover:text-black transition-colors"
        >
          Start over
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <span className="text-black/20 text-xs tracking-[0.4em] uppercase">—</span>
    </main>
  );
}

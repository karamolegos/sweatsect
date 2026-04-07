/**
 * Supabase client factories.
 * - Browser client: uses anon key (respects RLS)
 * - Server client: uses service role key (bypasses RLS — admin operations only)
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Browser / client components — respects RLS
// Uses implicit flow so magic links work across devices (email app → any browser)
export function createBrowserClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      flowType: "implicit",
      detectSessionInUrl: true,
      persistSession: true,
    },
  });
}

// Server / API routes — bypasses RLS. Never expose to browser.
export function createServerClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

// Gym code validation
export async function validateGymCode(
  code: string
): Promise<{ valid: boolean; gym_id?: string; gym_name?: string }> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("gyms")
    .select("id, name")
    .eq("code", code.toUpperCase().trim())
    .eq("active", true)
    .single();

  if (error || !data) return { valid: false };
  return { valid: true, gym_id: data.id, gym_name: data.name };
}

// Lock user to gym on first auth (idempotent — safe to call multiple times)
export async function lockUserToGym(
  user_id: string,
  gym_id: string
): Promise<void> {
  const supabase = createServerClient();
  await supabase.from("profiles").upsert(
    { user_id, gym_id, locked_at: new Date().toISOString() },
    { onConflict: "user_id", ignoreDuplicates: true } // once locked, never change
  );
}

// Get user's locked gym
export async function getUserGym(
  user_id: string
): Promise<{ gym_id: string } | null> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("gym_id")
    .eq("user_id", user_id)
    .single();
  return data;
}

// Write commission after order completes
export async function writeCommission(payload: {
  order_id: number;
  gym_id: string;
  amount: number;
}): Promise<void> {
  const supabase = createServerClient();
  await supabase.from("commissions").insert({
    ...payload,
    status: "pending",
    created_at: new Date().toISOString(),
  });
}

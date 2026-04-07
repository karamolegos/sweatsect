import { type NextRequest, NextResponse } from "next/server";
import { createServerClient, lockUserToGym } from "@/lib/supabase";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    // Verify the user's JWT from Authorization header
    const jwt = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!jwt) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(jwt);

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { gym_id } = (await req.json()) as { gym_id: string };
    if (!gym_id || typeof gym_id !== "string") {
      return NextResponse.json({ error: "Missing gym_id" }, { status: 400 });
    }

    // Idempotent — safe to call on every login (ignoreDuplicates: true)
    await lockUserToGym(user.id, gym_id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[lock-gym]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const { pin } = (await req.json()) as { pin: string };
    if (!pin || typeof pin !== "string") {
      return NextResponse.json({ valid: false }, { status: 400 });
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("gyms")
      .select("id, name")
      .eq("portal_pin", pin.trim())
      .eq("active", true)
      .single();

    if (error || !data) {
      return NextResponse.json({ valid: false });
    }

    return NextResponse.json({ valid: true, gym_name: data.name });
  } catch (err) {
    console.error("[partner/login]", err);
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}

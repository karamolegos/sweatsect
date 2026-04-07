import { type NextRequest, NextResponse } from "next/server";
import { validateGymCode } from "@/lib/supabase";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const { code } = (await req.json()) as { code: string };

    if (!code || typeof code !== "string" || code.length > 30) {
      return NextResponse.json({ valid: false }, { status: 400 });
    }

    const result = await validateGymCode(code);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[validate-code]", err);
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}

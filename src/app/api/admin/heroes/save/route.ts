import { NextResponse } from "next/server";

import { saveHeroPayload } from "@/lib/content/admin";
import { heroSchema } from "@/lib/content/schemas";

export async function POST(request: Request) {
  try {
    const payload = heroSchema.parse(await request.json());
    const savedPath = await saveHeroPayload(payload);
    return NextResponse.json({ ok: true, path: savedPath });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save hero." },
      { status: 400 },
    );
  }
}

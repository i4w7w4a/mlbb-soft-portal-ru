import { NextResponse } from "next/server";

import { saveNewsPayload } from "@/lib/content/admin";
import { newsSchema } from "@/lib/content/schemas";

export async function POST(request: Request) {
  try {
    const payload = newsSchema.parse(await request.json());
    const savedPath = await saveNewsPayload(payload);
    return NextResponse.json({ ok: true, path: savedPath });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save story." },
      { status: 400 },
    );
  }
}


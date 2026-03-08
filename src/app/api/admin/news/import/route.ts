import { NextResponse } from "next/server";

import { importNewsBatch } from "@/lib/content/admin";
import { newsSchema } from "@/lib/content/schemas";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as unknown[];
    const stories = payload.map((entry) => newsSchema.parse(entry));
    const imported = await importNewsBatch(stories);
    return NextResponse.json({ ok: true, imported });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to import stories." },
      { status: 400 },
    );
  }
}


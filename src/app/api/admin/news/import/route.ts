import { NextResponse } from "next/server";

import { importNewsBatch, parseNewsImportPayload } from "@/lib/content/admin";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as unknown;
    const stories = parseNewsImportPayload(payload);
    const imported = await importNewsBatch(stories);
    return NextResponse.json({ ok: true, imported });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to import stories." },
      { status: 400 },
    );
  }
}

import { NextResponse } from "next/server";

import { parseTaxonomyPayload, saveTaxonomyPayload } from "@/lib/content/admin";

export async function POST(request: Request) {
  try {
    const payload = parseTaxonomyPayload(await request.json());
    const savedPaths = await saveTaxonomyPayload(payload);
    return NextResponse.json({ ok: true, ...savedPaths });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save taxonomy." },
      { status: 400 },
    );
  }
}

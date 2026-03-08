import { NextResponse } from "next/server";

import { importPortalBundle, parsePortalImportPayload } from "@/lib/content/admin";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as unknown;
    const bundle = parsePortalImportPayload(payload);
    const imported = await importPortalBundle(bundle);
    return NextResponse.json({ ok: true, imported });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to import content bundle." },
      { status: 400 },
    );
  }
}

import { NextResponse } from "next/server";

import { duplicateNewsBySlug } from "@/lib/content/admin";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { slug?: string };

    if (!body.slug) {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }

    const duplicate = await duplicateNewsBySlug(body.slug);
    return NextResponse.json({ ok: true, duplicate });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to duplicate story." },
      { status: 400 },
    );
  }
}


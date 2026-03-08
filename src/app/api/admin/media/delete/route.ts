import { NextResponse } from "next/server";
import { z } from "zod";

import { mediaBucketValues } from "@/lib/media/repository";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

const deleteSchema = z.object({
  bucket: z.enum(mediaBucketValues),
  storagePath: z.string().trim().min(1),
});

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseAdmin();

    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase admin env vars are not configured." },
        { status: 400 },
      );
    }

    const payload = deleteSchema.parse(await request.json());
    const { error } = await supabase.storage
      .from(payload.bucket)
      .remove([payload.storagePath.replace(/^\/+/, "")]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete asset." },
      { status: 400 },
    );
  }
}

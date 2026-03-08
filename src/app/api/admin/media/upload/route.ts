import { NextResponse } from "next/server";
import { z } from "zod";

import { mediaBucketValues } from "@/lib/media/repository";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

const uploadSchema = z.object({
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

    const formData = await request.formData();
    const file = formData.get("file");
    const payload = uploadSchema.parse({
      bucket: formData.get("bucket"),
      storagePath: formData.get("storagePath"),
    });

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "A file upload is required." },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { error } = await supabase.storage
      .from(payload.bucket)
      .upload(payload.storagePath.replace(/^\/+/, ""), buffer, {
        upsert: true,
        contentType: file.type || undefined,
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      bucket: payload.bucket,
      storagePath: payload.storagePath.replace(/^\/+/, ""),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload asset." },
      { status: 400 },
    );
  }
}

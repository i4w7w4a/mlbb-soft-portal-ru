import { NextResponse } from "next/server";

import { exportPortalSnapshot } from "@/lib/content/admin";

export async function GET() {
  const snapshot = await exportPortalSnapshot();

  return new NextResponse(JSON.stringify(snapshot, null, 2), {
    headers: {
      "content-type": "application/json",
      "content-disposition": 'attachment; filename="portal-export.json"',
    },
  });
}

"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";

export default function PortalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto w-[min(100%-1.5rem,72rem)] py-12">
      <EmptyState
        eyebrow="Portal Recovery"
        title="The editorial surface lost sync."
        description="Reload this route to recover the current content stream. If the problem persists, jump back to the hub and retry from a stable entry point."
        tone="soft"
        actions={
          <>
            <Button type="button" onClick={() => reset()}>
              <RotateCcw className="size-4" />
              Retry route
            </Button>
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-full border border-white/12 bg-white/6 px-5 text-sm font-medium text-white transition-colors hover:border-white/24 hover:bg-white/10"
            >
              Back to hub
            </Link>
          </>
        }
      />
    </div>
  );
}

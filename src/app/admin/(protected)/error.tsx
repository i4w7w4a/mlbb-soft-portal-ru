"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";

export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <EmptyState
      eyebrow="Admin Recovery"
      title="The operator surface hit an unexpected fault."
      description="Retry the current admin route to rehydrate the latest JSON snapshot, or fall back to the dashboard while the content layer settles."
      tone="soft"
      actions={
        <>
          <Button type="button" onClick={() => reset()}>
            <RotateCcw className="size-4" />
            Retry admin route
          </Button>
          <Link
            href="/admin"
            className="inline-flex h-11 items-center justify-center rounded-full border border-white/12 bg-white/6 px-5 text-sm font-medium text-white transition-colors hover:border-white/24 hover:bg-white/10"
          >
            Go to dashboard
          </Link>
        </>
      }
    />
  );
}

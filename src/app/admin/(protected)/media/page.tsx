import { MediaManager } from "@/components/admin/media-manager";
import { Card } from "@/components/ui/card";
import { getLibrarySnapshot } from "@/lib/media/repository";

export default async function AdminMediaPage() {
  const snapshot = await getLibrarySnapshot();

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <p className="font-display text-3xl text-white">Media management</p>
        <p className="text-sm leading-6 text-slate-400">
          Browse the live asset graph, inspect which hero and story surfaces depend on
          each file, and operate the local media layer from one admin surface. Optional
          remote adapters can be layered in later without changing the authoring model.
        </p>
      </Card>
      <MediaManager snapshot={snapshot} />
    </div>
  );
}

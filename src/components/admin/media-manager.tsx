"use client";

import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Copy,
  ExternalLink,
  FolderOpen,
  ImageOff,
  Library,
} from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  MediaAsset,
  MediaBucket,
  MediaLibrarySnapshot,
  MediaSourceSummary,
} from "@/lib/media/repository";
import { cn } from "@/lib/utils";

const selectClassName =
  "h-12 w-full rounded-2xl border border-white/12 bg-black/30 px-4 text-sm text-white outline-none transition-colors focus:border-cyan-300/45 focus:ring-2 focus:ring-cyan-300/20";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatBytes(bytes: number | null) {
  if (bytes === null) {
    return "Pending";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`;
}

function Notice({
  tone,
  children,
}: {
  tone: "success" | "error";
  children: React.ReactNode;
}) {
  return (
    <Card
      className={cn(
        "text-sm leading-6",
        tone === "success"
          ? "border-cyan-300/20 bg-[radial-gradient(circle_at_top,rgba(101,230,255,0.18),transparent_46%),linear-gradient(180deg,rgba(7,28,39,0.96),rgba(5,12,18,0.98))] text-cyan-50"
          : "border-rose-300/20 bg-[radial-gradient(circle_at_top,rgba(251,113,133,0.16),transparent_46%),linear-gradient(180deg,rgba(32,11,18,0.96),rgba(18,5,9,0.98))] text-rose-100",
      )}
    >
      <p aria-live="polite">{children}</p>
    </Card>
  );
}

function sourceVariant(source: MediaSourceSummary) {
  if (source.status === "active") {
    return "soft" as const;
  }

  if (source.status === "standby") {
    return "highlight" as const;
  }

  return "default" as const;
}

function assetStateLabel(asset: MediaAsset) {
  if (asset.status === "missing") {
    return "Missing";
  }

  if (asset.isOrphan) {
    return "Orphan";
  }

  return "Live";
}

function assetStateVariant(asset: MediaAsset) {
  if (asset.status === "missing") {
    return "highlight" as const;
  }

  if (asset.isOrphan) {
    return "default" as const;
  }

  return "soft" as const;
}

export function MediaManager({
  snapshot,
}: {
  snapshot: MediaLibrarySnapshot;
}) {
  const [query, setQuery] = useState("");
  const [bucketFilter, setBucketFilter] = useState<MediaBucket | "all">("all");
  const [stateFilter, setStateFilter] = useState<
    "all" | "available" | "missing" | "in-use" | "orphaned"
  >("all");
  const [selectedAssetId, setSelectedAssetId] = useState(snapshot.assets[0]?.id ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query);

  const visibleAssets = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();

    return snapshot.assets.filter((asset) => {
      const matchesQuery =
        !normalizedQuery ||
        [
          asset.fileName,
          asset.publicPath,
          asset.bucket,
          ...asset.usage.map((usage) => usage.label),
          ...asset.usage.map((usage) => usage.context),
        ].some((value) => value.toLowerCase().includes(normalizedQuery));

      const matchesBucket = bucketFilter === "all" || asset.bucket === bucketFilter;
      const matchesState =
        stateFilter === "all" ||
        (stateFilter === "available" && asset.status === "available") ||
        (stateFilter === "missing" && asset.status === "missing") ||
        (stateFilter === "in-use" && asset.status === "available" && asset.usageCount > 0) ||
        (stateFilter === "orphaned" && asset.isOrphan);

      return matchesQuery && matchesBucket && matchesState;
    });
  }, [bucketFilter, deferredQuery, snapshot.assets, stateFilter]);

  const activeSelectedAssetId = visibleAssets.some((asset) => asset.id === selectedAssetId)
    ? selectedAssetId
    : (visibleAssets[0]?.id ?? "");

  const selectedAsset =
    visibleAssets.find((asset) => asset.id === activeSelectedAssetId) ?? null;

  async function copyValue(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setError(null);
      setMessage(`${label} copied to clipboard.`);
    } catch {
      setMessage(null);
      setError(`Could not copy ${label.toLowerCase()} from this browser session.`);
    }
  }

  return (
    <div className="space-y-6">
      {snapshot.sources.some((source) => source.id === "supabase" && source.status === "blocked") ? (
        <Card className="border-amber-300/20 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.16),transparent_44%),linear-gradient(180deg,rgba(40,22,7,0.96),rgba(18,10,4,0.98))] text-amber-50">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="font-display text-2xl">Local fallback is driving media ops</p>
              <p className="max-w-3xl text-sm leading-6 text-amber-100/80">
                Supabase Storage is not available in this environment yet, so the media
                screen tracks `public/images` and content-linked references directly.
              </p>
            </div>
            <Badge variant="highlight">Fallback active</Badge>
          </div>
        </Card>
      ) : null}

      {message ? <Notice tone="success">{message}</Notice> : null}
      {error ? <Notice tone="error">{error}</Notice> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="space-y-2">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Tracked assets</p>
          <p className="font-display text-4xl text-white">{snapshot.totals.available}</p>
          <p className="text-sm leading-6 text-slate-400">
            Files physically present in the current library.
          </p>
        </Card>
        <Card className="space-y-2">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">In use</p>
          <p className="font-display text-4xl text-white">{snapshot.totals.inUse}</p>
          <p className="text-sm leading-6 text-slate-400">
            Assets already linked by hero and story content.
          </p>
        </Card>
        <Card className="space-y-2">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Orphans</p>
          <p className="font-display text-4xl text-white">{snapshot.totals.orphaned}</p>
          <p className="text-sm leading-6 text-slate-400">
            Files available locally but not referenced from the content graph.
          </p>
        </Card>
        <Card className="space-y-2">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Missing refs</p>
          <p className="font-display text-4xl text-white">{snapshot.totals.missing}</p>
          <p className="text-sm leading-6 text-slate-400">
            Content paths that are expected by the portal but have no local asset yet.
          </p>
        </Card>
      </div>

      <Card className="space-y-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="soft">Media graph</Badge>
              <Badge>Dual-source</Badge>
            </div>
            <div>
              <p className="font-display text-3xl text-white">
                Operate the asset layer across local files and remote buckets.
              </p>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                This surface tracks the local image graph, remote Supabase bucket
                mirrors, and the content references that still need coverage.
              </p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {snapshot.sources.map((source) => (
              <Card
                key={source.id}
                className="min-w-[16rem] space-y-3 border-white/8 bg-black/20 p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-display text-xl text-white">{source.label}</p>
                  <Badge variant={sourceVariant(source)}>{source.status}</Badge>
                </div>
                <p className="text-sm leading-6 text-slate-300">{source.description}</p>
                <p className="text-xs leading-6 uppercase tracking-[0.22em] text-slate-500">
                  {source.detail}
                </p>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,0.85fr)_minmax(0,0.85fr)]">
          <div className="space-y-2">
            <Label htmlFor="media-query">Search media</Label>
            <Input
              id="media-query"
              placeholder="Search by file name, path, hero, story title"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="media-bucket-filter">Bucket</Label>
            <select
              id="media-bucket-filter"
              className={selectClassName}
              value={bucketFilter}
              onChange={(event) =>
                setBucketFilter(event.target.value as MediaBucket | "all")
              }
            >
              <option value="all">All buckets</option>
              {snapshot.bucketSummaries.map((summary) => (
                <option key={summary.bucket} value={summary.bucket}>
                  {summary.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="media-state-filter">State</Label>
            <select
              id="media-state-filter"
              className={selectClassName}
              value={stateFilter}
              onChange={(event) =>
                setStateFilter(
                  event.target.value as
                    | "all"
                    | "available"
                    | "missing"
                    | "in-use"
                    | "orphaned",
                )
              }
            >
              <option value="all">All states</option>
              <option value="available">Available only</option>
              <option value="in-use">Linked only</option>
              <option value="orphaned">Orphans only</option>
              <option value="missing">Missing refs only</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {snapshot.bucketSummaries.map((summary) => (
            <button
              key={summary.bucket}
              type="button"
              onClick={() =>
                setBucketFilter((current) =>
                  current === summary.bucket ? "all" : summary.bucket,
                )
              }
              className={cn(
                "rounded-[28px] border p-5 text-left transition-colors",
                bucketFilter === summary.bucket
                  ? "border-cyan-300/30 bg-cyan-300/10"
                  : "border-white/8 bg-black/20 hover:border-white/18",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-display text-2xl text-white">{summary.label}</p>
                <Badge variant={summary.missing ? "highlight" : "default"}>
                  {summary.available} live
                </Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="soft">{summary.referenceEvents} refs</Badge>
                {summary.orphaned ? <Badge>{summary.orphaned} orphaned</Badge> : null}
                {summary.missing ? (
                  <Badge variant="highlight">{summary.missing} missing</Badge>
                ) : null}
              </div>
            </button>
          ))}
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_360px]">
        <Card className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-3xl text-white">Library</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Showing {visibleAssets.length} of {snapshot.assets.length} tracked assets.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {bucketFilter !== "all" ? <Badge>{bucketFilter}</Badge> : null}
              {stateFilter !== "all" ? <Badge variant="highlight">{stateFilter}</Badge> : null}
            </div>
          </div>

          {visibleAssets.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {visibleAssets.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => setSelectedAssetId(asset.id)}
                  className={cn(
                    "overflow-hidden rounded-[28px] border bg-black/20 text-left transition-colors",
                    activeSelectedAssetId === asset.id
                      ? "border-cyan-300/30"
                      : "border-white/8 hover:border-white/18",
                  )}
                >
                  <div className="relative aspect-[4/3] overflow-hidden border-b border-white/8 bg-[radial-gradient(circle_at_top,rgba(101,230,255,0.12),transparent_42%),linear-gradient(180deg,rgba(10,17,30,0.92),rgba(5,9,18,0.98))]">
                    {asset.previewUrl ? (
                      <Image
                        src={asset.previewUrl}
                        alt={asset.fileName}
                        fill
                        unoptimized
                        sizes="(min-width: 1280px) 24rem, (min-width: 768px) 40vw, 100vw"
                        className="object-contain p-6 opacity-90"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-500">
                        <ImageOff className="size-10" />
                      </div>
                    )}
                    <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                      <Badge variant={assetStateVariant(asset)}>{assetStateLabel(asset)}</Badge>
                      <Badge>{asset.bucket}</Badge>
                    </div>
                  </div>
                  <div className="space-y-3 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-medium text-white">{asset.fileName}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {asset.publicPath}
                        </p>
                      </div>
                      <div className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-slate-300">
                        {asset.usageCount} refs
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge>{formatBytes(asset.sizeBytes)}</Badge>
                      {asset.status === "available" && asset.isOrphan ? (
                        <Badge>Unused</Badge>
                      ) : null}
                      {asset.status === "missing" ? (
                        <Badge variant="highlight">Needs upload</Badge>
                      ) : null}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              eyebrow="Media library"
              title="No assets match the current operator view."
              description="Reset the query or state filters to restore the broader media graph."
              tone="soft"
              actions={
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setQuery("");
                    setBucketFilter("all");
                    setStateFilter("all");
                  }}
                >
                  Reset media filters
                </Button>
              }
            />
          )}
        </Card>

        <Card className="space-y-5 xl:sticky xl:top-6 xl:h-fit">
          {selectedAsset ? (
            <>
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={assetStateVariant(selectedAsset)}>
                    {assetStateLabel(selectedAsset)}
                  </Badge>
                  <Badge>{selectedAsset.bucket}</Badge>
                  <Badge>{selectedAsset.extension || "asset"}</Badge>
                </div>
                <div>
                  <p className="font-display text-3xl text-white">{selectedAsset.fileName}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {selectedAsset.publicPath}
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-[28px] border border-white/8 bg-[radial-gradient(circle_at_top,rgba(101,230,255,0.12),transparent_46%),linear-gradient(180deg,rgba(10,17,30,0.92),rgba(5,9,18,0.98))]">
                {selectedAsset.previewUrl ? (
                  <div className="relative aspect-[4/3] w-full">
                    <Image
                      src={selectedAsset.previewUrl}
                      alt={selectedAsset.fileName}
                      fill
                      unoptimized
                      sizes="(min-width: 1280px) 360px, 100vw"
                      className="object-contain p-8"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center text-slate-500">
                    <div className="space-y-3 text-center">
                      <ImageOff className="mx-auto size-10" />
                      <p className="text-sm uppercase tracking-[0.24em]">
                        Missing from library
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => void copyValue(selectedAsset.publicPath, "Public path")}
                >
                  <Copy className="size-4" />
                  Copy path
                </Button>
                {selectedAsset.previewUrl ? (
                  <a
                    href={selectedAsset.previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-white/12 px-4 text-sm font-medium text-slate-200 transition-colors hover:border-cyan-300/20 hover:text-white"
                  >
                    Open asset
                    <ExternalLink className="size-4" />
                  </a>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Source</p>
                  <p className="mt-2 text-sm text-slate-200">{selectedAsset.source}</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Size</p>
                  <p className="mt-2 text-sm text-slate-200">
                    {formatBytes(selectedAsset.sizeBytes)}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Updated</p>
                  <p className="mt-2 text-sm text-slate-200">
                    {selectedAsset.modifiedAt
                      ? dateFormatter.format(new Date(selectedAsset.modifiedAt))
                      : "Awaiting upload"}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                    References
                  </p>
                  <p className="mt-2 text-sm text-slate-200">{selectedAsset.usageCount}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Library className="size-4 text-cyan-100" />
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                    Linked surfaces
                  </p>
                </div>
                {selectedAsset.usage.length ? (
                  <div className="space-y-3">
                    {selectedAsset.usage.map((usage) => (
                      <Link
                        key={usage.id}
                        href={usage.href as Route}
                        className="flex items-start justify-between gap-3 rounded-[24px] border border-white/8 bg-black/20 px-4 py-4 transition-colors hover:border-cyan-300/20"
                      >
                        <div>
                          <p className="text-sm font-medium text-white">{usage.label}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-500">
                            {usage.context}
                          </p>
                        </div>
                        <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-slate-400" />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[24px] border border-dashed border-white/10 bg-black/20 px-4 py-5 text-sm leading-6 text-slate-400">
                    This asset is not linked from the current content graph yet. Keep it in
                    the library, or retire it when Storage workflows are ready.
                  </div>
                )}
              </div>
            </>
          ) : (
            <EmptyState
              eyebrow="Asset detail"
              title="Pick an asset to inspect the media graph."
              description="The detail panel shows source state, file metadata, and every live content surface that currently depends on the selected file."
              tone="soft"
              icon={<FolderOpen className="size-5" />}
            />
          )}
        </Card>
      </div>
    </div>
  );
}

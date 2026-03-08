import { promises as fs } from "node:fs";
import path from "node:path";

import { createContentRepository } from "@/lib/content/repository";
import { hasSupabaseEnv } from "@/lib/supabase/config";

const DEFAULT_PUBLIC_ROOT = path.join(process.cwd(), "public");
const DEFAULT_CONTENT_ROOT = path.join(process.cwd(), "content");

const preferredBucketOrder = ["heroes", "news", "brand", "social", "misc"] as const;

type PreferredBucket = (typeof preferredBucketOrder)[number];

export type MediaBucket = PreferredBucket;
export type MediaAssetStatus = "available" | "missing";
export type MediaUsageKind = "hero-avatar" | "hero-cover" | "news-cover";
export type MediaSourceStatus = "active" | "standby" | "blocked";

export type MediaUsage = {
  id: string;
  kind: MediaUsageKind;
  label: string;
  href: string;
  context: string;
};

export type MediaAsset = {
  id: string;
  bucket: MediaBucket;
  fileName: string;
  extension: string;
  publicPath: string;
  relativePath: string;
  status: MediaAssetStatus;
  source: "local" | "reference";
  previewUrl: string | null;
  sizeBytes: number | null;
  modifiedAt: string | null;
  usage: MediaUsage[];
  usageCount: number;
  isOrphan: boolean;
};

export type MediaBucketSummary = {
  bucket: MediaBucket;
  label: string;
  available: number;
  missing: number;
  inUse: number;
  orphaned: number;
  referenceEvents: number;
  recommended: boolean;
};

export type MediaSourceSummary = {
  id: "local" | "supabase";
  label: string;
  status: MediaSourceStatus;
  description: string;
  detail: string;
};

export type MediaLibrarySnapshot = {
  assets: MediaAsset[];
  bucketSummaries: MediaBucketSummary[];
  totals: {
    available: number;
    missing: number;
    inUse: number;
    orphaned: number;
    referenceEvents: number;
  };
  sources: MediaSourceSummary[];
};

function toPosixPath(value: string) {
  return value.replace(/\\/g, "/");
}

function getBucket(publicPath: string): MediaBucket {
  const segments = publicPath.split("/").filter(Boolean);
  const bucket = segments[1];

  if (preferredBucketOrder.includes(bucket as PreferredBucket)) {
    return bucket as MediaBucket;
  }

  return "misc";
}

function getBucketLabel(bucket: MediaBucket) {
  switch (bucket) {
    case "heroes":
      return "Hero media";
    case "news":
      return "Story media";
    case "brand":
      return "Brand system";
    case "social":
      return "Social exports";
    case "misc":
    default:
      return "Misc";
  }
}

async function directoryExists(targetPath: string) {
  try {
    const stats = await fs.stat(targetPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

async function walkFiles(rootPath: string): Promise<string[]> {
  if (!(await directoryExists(rootPath))) {
    return [];
  }

  const entries = await fs.readdir(rootPath, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(rootPath, entry.name);
      if (entry.isDirectory()) {
        return walkFiles(entryPath);
      }

      return [entryPath];
    }),
  );

  return nested.flat();
}

function addUsage(
  references: Map<string, MediaUsage[]>,
  publicPath: string | undefined,
  usage: MediaUsage,
) {
  if (!publicPath?.startsWith("/images/")) {
    return;
  }

  const current = references.get(publicPath) ?? [];
  current.push(usage);
  references.set(publicPath, current);
}

function sortAssets(left: MediaAsset, right: MediaAsset) {
  return (
    Number(right.status === "missing") - Number(left.status === "missing") ||
    Number(right.usageCount > 0) - Number(left.usageCount > 0) ||
    right.usageCount - left.usageCount ||
    preferredBucketOrder.indexOf(left.bucket) - preferredBucketOrder.indexOf(right.bucket) ||
    left.publicPath.localeCompare(right.publicPath)
  );
}

function buildSourceSummaries(assetCount: number): MediaSourceSummary[] {
  return [
    {
      id: "local",
      label: "Local library",
      status: "active",
      description: "Reads `public/images` as the current operator source.",
      detail: `${assetCount} tracked files are available immediately in local admin mode.`,
    },
    {
      id: "supabase",
      label: "Supabase Storage",
      status: hasSupabaseEnv() ? "standby" : "blocked",
      description: hasSupabaseEnv()
        ? "Environment variables exist, but the remote storage adapter is not wired yet."
        : "Environment variables are missing, so the local library remains the primary source.",
      detail: hasSupabaseEnv()
        ? "Keep the boundary stable here, then swap in bucket listing and upload flows later."
        : "This screen still works without remote storage and highlights what is already linked in content.",
    },
  ];
}

export function createMediaRepository(options?: {
  publicRoot?: string;
  contentRoot?: string;
}) {
  const publicRoot = options?.publicRoot ?? DEFAULT_PUBLIC_ROOT;
  const contentRoot = options?.contentRoot ?? DEFAULT_CONTENT_ROOT;
  const imageRoot = path.join(publicRoot, "images");
  const contentRepository = createContentRepository({ contentRoot });

  async function getLibrarySnapshot(): Promise<MediaLibrarySnapshot> {
    const [files, heroes, news] = await Promise.all([
      walkFiles(imageRoot),
      contentRepository.getAllHeroes(),
      contentRepository.getAllNews(true),
    ]);

    const references = new Map<string, MediaUsage[]>();

    heroes.forEach((hero) => {
      addUsage(references, hero.avatar, {
        id: `hero-avatar:${hero.slug}`,
        kind: "hero-avatar",
        label: `${hero.name} avatar`,
        href: `/heroes/${hero.slug}`,
        context: "Hero profile",
      });
      addUsage(references, hero.cover, {
        id: `hero-cover:${hero.slug}`,
        kind: "hero-cover",
        label: `${hero.name} cover`,
        href: `/heroes/${hero.slug}`,
        context: "Hero page",
      });
    });

    news.forEach((story) => {
      const hero = heroes.find((entry) => entry.slug === story.heroSlug);
      addUsage(references, story.cover, {
        id: `news-cover:${story.slug}`,
        kind: "news-cover",
        label: story.title,
        href: `/news/${story.slug}`,
        context: hero ? `${hero.name} story cover` : "Story cover",
      });
    });

    const availableAssets = await Promise.all(
      files.map(async (filePath) => {
        const relativePath = toPosixPath(path.relative(publicRoot, filePath));
        const publicPath = `/${relativePath}`;
        const stats = await fs.stat(filePath);
        const usage = references.get(publicPath) ?? [];

        return {
          id: publicPath,
          bucket: getBucket(publicPath),
          fileName: path.basename(filePath),
          extension: path.extname(filePath).replace(/^\./, "").toLowerCase(),
          publicPath,
          relativePath,
          status: "available",
          source: "local",
          previewUrl: publicPath,
          sizeBytes: stats.size,
          modifiedAt: stats.mtime.toISOString(),
          usage,
          usageCount: usage.length,
          isOrphan: usage.length === 0,
        } satisfies MediaAsset;
      }),
    );

    const availablePathSet = new Set(availableAssets.map((asset) => asset.publicPath));
    const missingAssets = Array.from(references.entries())
      .filter(([publicPath]) => !availablePathSet.has(publicPath))
      .map(([publicPath, usage]) => ({
        id: `missing:${publicPath}`,
        bucket: getBucket(publicPath),
        fileName: publicPath.split("/").filter(Boolean).at(-1) ?? publicPath,
        extension: path.extname(publicPath).replace(/^\./, "").toLowerCase(),
        publicPath,
        relativePath: publicPath.replace(/^\//, ""),
        status: "missing",
        source: "reference",
        previewUrl: null,
        sizeBytes: null,
        modifiedAt: null,
        usage,
        usageCount: usage.length,
        isOrphan: false,
      }) satisfies MediaAsset);

    const assets = [...availableAssets, ...missingAssets].sort(sortAssets);

    const bucketSummaries = preferredBucketOrder.map((bucket) => {
      const bucketAssets = assets.filter((asset) => asset.bucket === bucket);
      const available = bucketAssets.filter((asset) => asset.status === "available").length;
      const missing = bucketAssets.filter((asset) => asset.status === "missing").length;
      const inUse = bucketAssets.filter(
        (asset) => asset.status === "available" && asset.usageCount > 0,
      ).length;
      const orphaned = bucketAssets.filter((asset) => asset.isOrphan).length;
      const referenceEvents = bucketAssets.reduce(
        (total, asset) => total + asset.usageCount,
        0,
      );

      return {
        bucket,
        label: getBucketLabel(bucket),
        available,
        missing,
        inUse,
        orphaned,
        referenceEvents,
        recommended: bucket !== "misc",
      } satisfies MediaBucketSummary;
    });

    return {
      assets,
      bucketSummaries,
      totals: {
        available: availableAssets.length,
        missing: missingAssets.length,
        inUse: availableAssets.filter((asset) => asset.usageCount > 0).length,
        orphaned: availableAssets.filter((asset) => asset.isOrphan).length,
        referenceEvents: assets.reduce((total, asset) => total + asset.usageCount, 0),
      },
      sources: buildSourceSummaries(availableAssets.length),
    };
  }

  return {
    getLibrarySnapshot,
  };
}

const repository = createMediaRepository();

export const { getLibrarySnapshot } = repository;

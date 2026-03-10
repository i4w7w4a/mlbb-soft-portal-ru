import { promises as fs } from "node:fs";
import path from "node:path";

import { getContentRoot } from "@/lib/content/paths";
import { createContentRepository } from "@/lib/content/repository";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv, hasSupabaseEnv } from "@/lib/supabase/config";

const DEFAULT_PUBLIC_ROOT = path.join(process.cwd(), "public");

export const mediaBucketValues = [
  "heroes",
  "news",
  "brand",
  "social",
  "misc",
] as const;

const preferredBucketOrder = mediaBucketValues;

type PreferredBucket = (typeof mediaBucketValues)[number];
type AssetSource = "local" | "supabase" | "reference";
type AssetWithUsage = Omit<MediaAsset, "usage" | "usageCount" | "isOrphan">;

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
  storagePath: string | null;
  status: MediaAssetStatus;
  source: AssetSource;
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

type RemoteAssetsResult = {
  assets: AssetWithUsage[];
  source: MediaSourceSummary;
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

function getPublicPath(bucket: MediaBucket, storagePath: string) {
  return `/images/${bucket}/${toPosixPath(storagePath).replace(/^\/+/, "")}`;
}

function buildLocalSourceSummary(assetCount: number): MediaSourceSummary {
  return {
    id: "local",
    label: "Local library",
    status: "active",
    description: "Reads `public/images` as the current operator source.",
    detail: `${assetCount} tracked files are available immediately in local admin mode.`,
  };
}

function buildSupabaseSourceSummary(
  status: MediaSourceStatus,
  description: string,
  detail: string,
): MediaSourceSummary {
  return {
    id: "supabase",
    label: "Supabase Storage",
    status,
    description,
    detail,
  };
}

function sortAssets(left: MediaAsset, right: MediaAsset) {
  const sourceRank: Record<AssetSource, number> = {
    local: 0,
    supabase: 1,
    reference: 2,
  };

  return (
    Number(right.status === "missing") - Number(left.status === "missing") ||
    Number(right.usageCount > 0) - Number(left.usageCount > 0) ||
    right.usageCount - left.usageCount ||
    preferredBucketOrder.indexOf(left.bucket) - preferredBucketOrder.indexOf(right.bucket) ||
    sourceRank[left.source] - sourceRank[right.source] ||
    left.publicPath.localeCompare(right.publicPath)
  );
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

function attachUsage(
  asset: AssetWithUsage,
  references: Map<string, MediaUsage[]>,
): MediaAsset {
  const usage = references.get(asset.publicPath) ?? [];

  return {
    ...asset,
    usage,
    usageCount: usage.length,
    isOrphan: asset.status === "available" && usage.length === 0,
  };
}

async function listSupabaseBucketFiles(
  bucket: MediaBucket,
  bucketIsPublic: boolean,
  prefix = "",
): Promise<AssetWithUsage[]> {
  const supabase = createSupabaseAdmin();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase.storage.from(bucket).list(prefix, {
    limit: 1000,
    sortBy: {
      column: "name",
      order: "asc",
    },
  });

  if (error) {
    throw new Error(`Could not list Supabase bucket ${bucket}: ${error.message}`);
  }

  const nested = await Promise.all(
    (data ?? []).map(async (entry) => {
      const storagePath = prefix ? `${prefix}/${entry.name}` : entry.name;
      const isFolder = !entry.id && entry.metadata === null;

      if (isFolder) {
        return listSupabaseBucketFiles(bucket, bucketIsPublic, storagePath);
      }

      const previewUrl = bucketIsPublic
        ? supabase.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl
        : (
            await supabase.storage
              .from(bucket)
              .createSignedUrl(storagePath, 60 * 60)
          ).data?.signedUrl ?? null;

      return [
        {
          id: `supabase:${bucket}:${storagePath}`,
          bucket,
          fileName: path.posix.basename(storagePath),
          extension: path.posix.extname(storagePath).replace(/^\./, "").toLowerCase(),
          publicPath: getPublicPath(bucket, storagePath),
          relativePath: toPosixPath(path.posix.join("images", bucket, storagePath)),
          storagePath,
          status: "available",
          source: "supabase" as const,
          previewUrl,
          sizeBytes:
            typeof entry.metadata?.size === "number" ? entry.metadata.size : null,
          modifiedAt: entry.updated_at ?? null,
        } satisfies AssetWithUsage,
      ];
    }),
  );

  return nested.flat();
}

async function loadSupabaseAssets(): Promise<RemoteAssetsResult> {
  if (!hasSupabaseEnv()) {
    return {
      assets: [],
      source: buildSupabaseSourceSummary(
        "blocked",
        "Environment variables are missing, so the local library remains the primary source.",
        "Remote buckets stay unavailable until Supabase credentials are configured.",
      ),
    };
  }

  if (!hasSupabaseAdminEnv()) {
    return {
      assets: [],
      source: buildSupabaseSourceSummary(
        "standby",
        "Public Supabase env vars exist, but the service-role key is missing for storage ops.",
        "Add SUPABASE_SERVICE_ROLE_KEY to unlock bucket listing, upload, and delete flows.",
      ),
    };
  }

  const supabase = createSupabaseAdmin();

  if (!supabase) {
    return {
      assets: [],
      source: buildSupabaseSourceSummary(
        "standby",
        "Supabase admin client could not be created in this environment.",
        "Check the server env config before wiring remote media ops.",
      ),
    };
  }

  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      throw new Error(error.message);
    }

    const availableBuckets = (buckets ?? []).filter((bucket) =>
      preferredBucketOrder.includes(bucket.name as PreferredBucket),
    );

    if (!availableBuckets.length) {
      return {
        assets: [],
        source: buildSupabaseSourceSummary(
          "standby",
          "Supabase is reachable, but no preferred media buckets are available yet.",
          "Create or expose buckets named heroes, news, brand, social, or misc.",
        ),
      };
    }

    const assets = (
      await Promise.all(
        availableBuckets.map((bucket) =>
          listSupabaseBucketFiles(
            bucket.name as MediaBucket,
            Boolean(bucket.public),
          ),
        ),
      )
    ).flat();

    return {
      assets,
      source: buildSupabaseSourceSummary(
        "active",
        "Lists remote bucket assets with the service-role client.",
        `${assets.length} remote asset${assets.length === 1 ? "" : "s"} discovered across ${availableBuckets.length} bucket${availableBuckets.length === 1 ? "" : "s"}.`,
      ),
    };
  } catch (error) {
    return {
      assets: [],
      source: buildSupabaseSourceSummary(
        "standby",
        "Supabase env vars exist, but remote storage could not be queried cleanly.",
        error instanceof Error ? error.message : "Unknown Supabase storage failure.",
      ),
    };
  }
}

export function createMediaRepository(options?: {
  publicRoot?: string;
  contentRoot?: string;
  remoteAssetsLoader?: () => Promise<RemoteAssetsResult>;
}) {
  const publicRoot = options?.publicRoot ?? DEFAULT_PUBLIC_ROOT;
  const contentRoot = options?.contentRoot ?? getContentRoot();
  const imageRoot = path.join(publicRoot, "images");
  const contentRepository = createContentRepository({ contentRoot });

  async function getLibrarySnapshot(): Promise<MediaLibrarySnapshot> {
    const [files, heroes, news, remoteAssetsResult] = await Promise.all([
      walkFiles(imageRoot),
      contentRepository.getAllHeroes(),
      contentRepository.getAllNews(true),
      (options?.remoteAssetsLoader ?? loadSupabaseAssets)(),
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

    const localAssets = await Promise.all(
      files.map(async (filePath) => {
        const relativePath = toPosixPath(path.relative(publicRoot, filePath));
        const publicPath = `/${relativePath}`;
        const stats = await fs.stat(filePath);

        return attachUsage(
          {
            id: `local:${publicPath}`,
            bucket: getBucket(publicPath),
            fileName: path.basename(filePath),
            extension: path.extname(filePath).replace(/^\./, "").toLowerCase(),
            publicPath,
            relativePath,
            storagePath: null,
            status: "available",
            source: "local",
            previewUrl: publicPath,
            sizeBytes: stats.size,
            modifiedAt: stats.mtime.toISOString(),
          },
          references,
        );
      }),
    );

    const remoteAssets = remoteAssetsResult.assets.map((asset) =>
      attachUsage(asset, references),
    );
    const availablePathSet = new Set(
      [...localAssets, ...remoteAssets].map((asset) => asset.publicPath),
    );
    const missingAssets = Array.from(references.entries())
      .filter(([publicPath]) => !availablePathSet.has(publicPath))
      .map(([publicPath, usage]) => ({
        id: `missing:${publicPath}`,
        bucket: getBucket(publicPath),
        fileName: publicPath.split("/").filter(Boolean).at(-1) ?? publicPath,
        extension: path.extname(publicPath).replace(/^\./, "").toLowerCase(),
        publicPath,
        relativePath: publicPath.replace(/^\//, ""),
        storagePath: publicPath
          .replace(/^\/images\//, "")
          .split("/")
          .slice(1)
          .join("/"),
        status: "missing",
        source: "reference",
        previewUrl: null,
        sizeBytes: null,
        modifiedAt: null,
        usage,
        usageCount: usage.length,
        isOrphan: false,
      }) satisfies MediaAsset);

    const assets = [...localAssets, ...remoteAssets, ...missingAssets].sort(sortAssets);

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
        available: localAssets.length + remoteAssets.length,
        missing: missingAssets.length,
        inUse: [...localAssets, ...remoteAssets].filter(
          (asset) => asset.usageCount > 0,
        ).length,
        orphaned: [...localAssets, ...remoteAssets].filter(
          (asset) => asset.isOrphan,
        ).length,
        referenceEvents: assets.reduce((total, asset) => total + asset.usageCount, 0),
      },
      sources: [
        buildLocalSourceSummary(localAssets.length),
        remoteAssetsResult.source,
      ],
    };
  }

  return {
    getLibrarySnapshot,
  };
}

const repository = createMediaRepository();

export const { getLibrarySnapshot } = repository;

import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import type { Hero, News } from "@/lib/content/schemas";
import { createMediaRepository } from "@/lib/media/repository";

const baseHero: Hero = {
  id: "alpha",
  slug: "alpha",
  name: "Alpha",
  title: "Test Hero",
  role: ["Mage"],
  lane: ["Mid"],
  specialty: ["Burst"],
  excerpt: "Fixture hero profile.",
  avatar: "/images/heroes/alpha/avatar.svg",
  cover: "/images/heroes/alpha/cover.svg",
  isFeatured: false,
  isSoftFeatured: false,
  tags: ["mage", "mid"],
  faction: "Fixture House",
  signature: "Burst windows",
  difficulty: "Medium",
  releaseYear: 2025,
  accent: "#65e6ff",
  seo: {
    title: "Alpha MLBB coverage",
    description: "Fixture SEO description.",
  },
};

const baseStory: News = {
  id: "2026-03-08-alpha-burst-guide",
  slug: "alpha-burst-guide",
  title: "Alpha Burst Guide",
  excerpt: "Fixture story excerpt.",
  heroSlug: "alpha",
  cover: "/images/heroes/alpha/cover.svg",
  status: "published",
  isSoft: false,
  isFeatured: false,
  category: "guide",
  tags: ["mage"],
  author: "Fixture Desk",
  publishedAt: "2026-03-08T10:00:00.000Z",
  readingTime: 4,
  seo: {
    title: "Alpha Burst Guide - MLBB Portal",
    description: "Fixture story SEO description.",
  },
  contentMarkdown: "# Fixture\n\nBody copy.",
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

async function writeJson(filePath: string, value: unknown) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function writeText(filePath: string, value: string) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, value, "utf8");
}

async function createFixtureRoot() {
  const root = await mkdtemp(path.join(os.tmpdir(), "mlbb-media-fixture-"));
  const contentRoot = path.join(root, "content");
  const publicRoot = path.join(root, "public");

  await writeJson(path.join(contentRoot, "heroes", "index.json"), {
    heroes: ["alpha"],
  });
  await writeJson(path.join(contentRoot, "heroes", "alpha", "hero.json"), clone(baseHero));
  await writeJson(
    path.join(contentRoot, "heroes", "alpha", "news", "2026-03-08-alpha-burst-guide.json"),
    clone(baseStory),
  );

  await writeText(
    path.join(publicRoot, "images", "heroes", "alpha", "avatar.svg"),
    "<svg xmlns='http://www.w3.org/2000/svg' />",
  );
  await writeText(
    path.join(publicRoot, "images", "brand", "soft-sigil.svg"),
    "<svg xmlns='http://www.w3.org/2000/svg' />",
  );

  return { root, contentRoot, publicRoot };
}

test("media repository links local assets to content references and surfaces missing files", async () => {
  const fixture = await createFixtureRoot();

  try {
    const repository = createMediaRepository({
      contentRoot: fixture.contentRoot,
      publicRoot: fixture.publicRoot,
    });

    const snapshot = await repository.getLibrarySnapshot();
    const avatarAsset = snapshot.assets.find(
      (asset) => asset.publicPath === "/images/heroes/alpha/avatar.svg",
    );
    const missingCover = snapshot.assets.find(
      (asset) => asset.publicPath === "/images/heroes/alpha/cover.svg",
    );
    const brandAsset = snapshot.assets.find(
      (asset) => asset.publicPath === "/images/brand/soft-sigil.svg",
    );
    const heroSummary = snapshot.bucketSummaries.find((summary) => summary.bucket === "heroes");

    assert.equal(snapshot.totals.available, 2);
    assert.equal(snapshot.totals.missing, 1);
    assert.equal(snapshot.totals.orphaned, 1);
    assert.equal(avatarAsset?.usageCount, 1);
    assert.equal(avatarAsset?.isOrphan, false);
    assert.equal(missingCover?.status, "missing");
    assert.equal(missingCover?.usageCount, 2);
    assert.equal(brandAsset?.isOrphan, true);
    assert.equal(heroSummary?.available, 1);
    assert.equal(heroSummary?.missing, 1);
    assert.equal(heroSummary?.referenceEvents, 3);
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test("media repository merges remote Supabase assets into the library snapshot", async () => {
  const fixture = await createFixtureRoot();

  try {
    const repository = createMediaRepository({
      contentRoot: fixture.contentRoot,
      publicRoot: fixture.publicRoot,
      remoteAssetsLoader: async () => ({
        assets: [
          {
            id: "supabase:heroes:alpha/cover.svg",
            bucket: "heroes",
            fileName: "cover.svg",
            extension: "svg",
            publicPath: "/images/heroes/alpha/cover.svg",
            relativePath: "images/heroes/alpha/cover.svg",
            storagePath: "alpha/cover.svg",
            status: "available",
            source: "supabase",
            previewUrl: "https://example.com/storage/v1/object/sign/heroes/alpha/cover.svg",
            sizeBytes: 512,
            modifiedAt: "2026-03-08T11:00:00.000Z",
          },
        ],
        source: {
          id: "supabase",
          label: "Supabase Storage",
          status: "active",
          description: "Remote assets loaded for the test fixture.",
          detail: "1 remote asset discovered.",
        },
      }),
    });

    const snapshot = await repository.getLibrarySnapshot();
    const remoteCover = snapshot.assets.find(
      (asset) =>
        asset.publicPath === "/images/heroes/alpha/cover.svg" &&
        asset.source === "supabase",
    );

    assert.equal(snapshot.totals.available, 3);
    assert.equal(snapshot.totals.missing, 0);
    assert.equal(remoteCover?.usageCount, 2);
    assert.equal(remoteCover?.storagePath, "alpha/cover.svg");
    assert.equal(snapshot.sources[1]?.status, "active");
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

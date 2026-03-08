import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { getAllHeroes, getAllNews } from "@/lib/content/repository";
import { createRootMetadata } from "@/lib/seo";

type MetadataLike = {
  metadataBase?: unknown;
  title?: unknown;
  description?: unknown;
  alternates?: {
    canonical?: unknown;
  };
  openGraph?: {
    type?: unknown;
    images?: unknown;
    publishedTime?: unknown;
  };
  twitter?: {
    images?: unknown;
  };
};

async function importModule<T>(relativePath: string): Promise<T> {
  const absolutePath = path.join(process.cwd(), relativePath);
  return import(pathToFileURL(absolutePath).href) as Promise<T>;
}

async function assertFileExists(relativePath: string) {
  try {
    await access(path.join(process.cwd(), relativePath));
  } catch {
    throw new Error(`Missing metadata asset file: ${relativePath}`);
  }
}

function coerceArray<T>(value: T | T[] | undefined | null) {
  if (Array.isArray(value)) {
    return value;
  }

  return value == null ? [] : [value];
}

function collectImageUrls(images: unknown) {
  return coerceArray(images).flatMap((image) => {
    if (!image) {
      return [];
    }

    if (typeof image === "string") {
      return [image];
    }

    if (typeof image === "object" && "url" in image) {
      const value = image.url;
      return [String(value)];
    }

    return [];
  });
}

function assertBasicMetadata(metadata: MetadataLike, label: string) {
  assert.ok(metadata.title, `${label}: missing title`);
  assert.ok(metadata.description, `${label}: missing description`);
  assert.ok(metadata.alternates?.canonical, `${label}: missing canonical alternate`);

  const openGraphImages = collectImageUrls(metadata.openGraph?.images);
  assert.ok(openGraphImages.length > 0, `${label}: missing Open Graph images`);

  const twitterImages = collectImageUrls(metadata.twitter?.images);
  assert.ok(twitterImages.length > 0, `${label}: missing Twitter images`);

  return {
    canonical: String(metadata.alternates?.canonical),
    openGraphImages,
    twitterImages,
  };
}

async function main() {
  const summary = {
    staticRoutes: 0,
    heroPages: 0,
    newsPages: 0,
    imageFiles: 0,
  };

  const rootMetadata = createRootMetadata() as MetadataLike;
  assert.ok(rootMetadata.metadataBase, "root metadata: missing metadataBase");
  assert.ok(rootMetadata.openGraph, "root metadata: missing root Open Graph");
  assert.ok(rootMetadata.twitter, "root metadata: missing root Twitter metadata");

  const staticModules = [
    { label: "home", path: "src/app/(portal)/page.tsx" },
    { label: "heroes", path: "src/app/(portal)/heroes/page.tsx" },
    { label: "news", path: "src/app/(portal)/news/page.tsx" },
    { label: "soft", path: "src/app/(portal)/soft/page.tsx" },
  ] as const;

  for (const route of staticModules) {
    const routeModule = await importModule<{ metadata: MetadataLike }>(route.path);
    const result = assertBasicMetadata(routeModule.metadata, route.label);
    assert.ok(
      result.openGraphImages.some((image) => image.includes("/opengraph-image")),
      `${route.label}: expected default OG image route`,
    );
    summary.staticRoutes += 1;
  }

  const searchModule = await importModule<{
    generateMetadata: (args: {
      searchParams: Promise<{ q?: string }>;
    }) => Promise<MetadataLike>;
  }>("src/app/(portal)/search/page.tsx");
  const searchMetadata = await searchModule.generateMetadata({
    searchParams: Promise.resolve({ q: "aamon" }),
  });
  const searchResult = assertBasicMetadata(searchMetadata, "search");
  assert.ok(
    searchResult.canonical.includes("/search?q=aamon"),
    "search: canonical URL should retain the search query",
  );
  summary.staticRoutes += 1;

  const heroes = await getAllHeroes();
  const heroPageModule = await importModule<{
    generateMetadata: (args: {
      params: Promise<{ slug: string }>;
    }) => Promise<MetadataLike>;
  }>("src/app/(portal)/heroes/[slug]/page.tsx");

  for (const hero of heroes) {
    const metadata = await heroPageModule.generateMetadata({
      params: Promise.resolve({ slug: hero.slug }),
    });
    const result = assertBasicMetadata(metadata, `hero:${hero.slug}`);
    assert.ok(
      result.canonical.endsWith(`/heroes/${hero.slug}`),
      `hero:${hero.slug}: canonical should point to the hero route`,
    );
    assert.ok(
      result.openGraphImages.some((image) =>
        image.includes(`/heroes/${hero.slug}/opengraph-image`),
      ),
      `hero:${hero.slug}: expected route-specific hero OG image`,
    );
    summary.heroPages += 1;
  }

  const stories = await getAllNews(true);
  const newsPageModule = await importModule<{
    generateMetadata: (args: {
      params: Promise<{ slug: string }>;
    }) => Promise<MetadataLike>;
  }>("src/app/(portal)/news/[slug]/page.tsx");

  for (const story of stories) {
    const metadata = await newsPageModule.generateMetadata({
      params: Promise.resolve({ slug: story.slug }),
    });
    const result = assertBasicMetadata(metadata, `news:${story.slug}`);
    assert.equal(
      metadata.openGraph?.type,
      "article",
      `news:${story.slug}: Open Graph type should be article`,
    );
    assert.equal(
      metadata.openGraph?.publishedTime,
      story.publishedAt,
      `news:${story.slug}: publishedTime should mirror content`,
    );
    assert.ok(
      result.canonical.endsWith(`/news/${story.slug}`),
      `news:${story.slug}: canonical should point to the article route`,
    );
    assert.ok(
      result.openGraphImages.some((image) =>
        image.includes(`/news/${story.slug}/opengraph-image`),
      ),
      `news:${story.slug}: expected route-specific article OG image`,
    );
    summary.newsPages += 1;
  }

  const metadataFiles = [
    "src/app/opengraph-image.tsx",
    "src/app/(portal)/heroes/[slug]/opengraph-image.tsx",
    "src/app/(portal)/news/[slug]/opengraph-image.tsx",
  ] as const;

  for (const metadataFile of metadataFiles) {
    await assertFileExists(metadataFile);
    summary.imageFiles += 1;
  }

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

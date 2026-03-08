import type { Metadata } from "next";

import type { Hero, News } from "@/lib/content/schemas";
import { siteConfig } from "@/lib/site-config";
import { unique } from "@/lib/utils";

const DEFAULT_SITE_URL = "http://localhost:3000";
const DEFAULT_OG_IMAGE_PATH = "/opengraph-image";
const OG_IMAGE_SIZE = {
  width: 1200,
  height: 630,
} as const;

type MetadataInput = {
  title: string;
  description: string;
  path?: string;
  imagePath?: string;
  imageAlt?: string;
  keywords?: string[];
  openGraphType?: "website" | "article";
  publishedTime?: string;
  authors?: string[];
  section?: string;
  tags?: string[];
};

function resolveRawSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim() || DEFAULT_SITE_URL;
}

export function resolveSiteUrl() {
  try {
    return new URL(resolveRawSiteUrl());
  } catch {
    return new URL(DEFAULT_SITE_URL);
  }
}

export function resolveAbsoluteUrl(path = "/") {
  return new URL(path, resolveSiteUrl());
}

function createTitle(title: string) {
  return title.includes(siteConfig.title) ? title : `${title} | ${siteConfig.title}`;
}

function createImageDescriptor(path: string, alt: string) {
  return {
    url: resolveAbsoluteUrl(path).toString(),
    alt,
    width: OG_IMAGE_SIZE.width,
    height: OG_IMAGE_SIZE.height,
  };
}

export function createMetadata({
  title,
  description,
  path = "/",
  imagePath = DEFAULT_OG_IMAGE_PATH,
  imageAlt,
  keywords = [],
  openGraphType = "website",
  publishedTime,
  authors,
  section,
  tags,
}: MetadataInput): Metadata {
  const fullTitle = createTitle(title);
  const canonicalUrl = resolveAbsoluteUrl(path).toString();
  const image = createImageDescriptor(imagePath, imageAlt ?? fullTitle);

  const openGraphBase = {
    title: fullTitle,
    description,
    url: canonicalUrl,
    siteName: siteConfig.title,
    locale: "en_US",
    images: [image],
  };

  const openGraph =
    openGraphType === "article"
      ? {
          ...openGraphBase,
          type: "article" as const,
          publishedTime,
          authors,
          section,
          tags,
        }
      : {
          ...openGraphBase,
          type: "website" as const,
        };

  return {
    title: fullTitle,
    description,
    keywords: unique(keywords.filter(Boolean)),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph,
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [image.url],
    },
  };
}

export function createRootMetadata(): Metadata {
  const metadataBase = resolveSiteUrl();
  const image = createImageDescriptor(
    DEFAULT_OG_IMAGE_PATH,
    `${siteConfig.title} Open Graph preview`,
  );

  return {
    metadataBase,
    applicationName: siteConfig.title,
    title: siteConfig.title,
    description: siteConfig.description,
    keywords: [
      "MLBB",
      "Mobile Legends",
      "SOFT Rift",
      "hero portal",
      "patch analysis",
      "esports editorial",
    ],
    openGraph: {
      title: siteConfig.title,
      description: siteConfig.description,
      url: metadataBase.toString(),
      siteName: siteConfig.title,
      locale: "en_US",
      type: "website",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: siteConfig.title,
      description: siteConfig.description,
      images: [image.url],
    },
  };
}

export function createHeroMetadata(hero: Hero) {
  return createMetadata({
    title: hero.seo.title,
    description: hero.seo.description,
    path: `/heroes/${hero.slug}`,
    imagePath: `/heroes/${hero.slug}/opengraph-image`,
    imageAlt: `${hero.name} MLBB hero page preview`,
    keywords: [
      hero.name,
      hero.title,
      ...hero.role,
      ...hero.lane,
      ...hero.tags,
      "MLBB hero",
    ],
  });
}

export function createNewsMetadata(story: News, heroName?: string) {
  return createMetadata({
    title: story.seo.title,
    description: story.seo.description,
    path: `/news/${story.slug}`,
    imagePath: `/news/${story.slug}/opengraph-image`,
    imageAlt: `${story.title} article preview`,
    keywords: [
      story.title,
      story.category,
      ...story.tags,
      heroName ?? story.heroSlug,
      "MLBB news",
    ],
    openGraphType: "article",
    publishedTime: story.publishedAt,
    authors: [story.author],
    section: story.category,
    tags: unique(story.tags),
  });
}

export function createSearchMetadata(query?: string) {
  const normalizedQuery = query?.trim() ?? "";

  if (!normalizedQuery) {
    return createMetadata({
      title: "Search",
      description: "Global search across MLBB heroes, news and tags.",
      path: "/search",
      keywords: ["search", "MLBB heroes", "MLBB news", "SOFT"],
    });
  }

  const encodedQuery = encodeURIComponent(normalizedQuery);

  return createMetadata({
    title: `Search results for "${normalizedQuery}"`,
    description: `Search MLBB heroes, stories, and SOFT-tagged topics for ${normalizedQuery}.`,
    path: `/search?q=${encodedQuery}`,
    keywords: ["search", normalizedQuery, "MLBB", "SOFT"],
  });
}

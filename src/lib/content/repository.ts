import { cache } from "react";
import { promises as fs } from "fs";
import path from "path";

import {
  heroSchema,
  latestIndexSchema,
  newsSchema,
  siteSettingsSchema,
  softConfigSchema,
  taxonomyCategorySchema,
  taxonomyTagSchema,
  type Hero,
  type LatestIndex,
  type News,
  type SiteSettings,
  type SoftConfig,
  type TaxonomyCategory,
  type TaxonomyTag,
} from "@/lib/content/schemas";

const CONTENT_ROOT = path.join(process.cwd(), "content");
const HERO_ROOT = path.join(CONTENT_ROOT, "heroes");

async function readJson<T>(filePath: string): Promise<T> {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

async function directoryExists(targetPath: string) {
  try {
    const stats = await fs.stat(targetPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

function sortByPublishedDate(news: News[]) {
  return [...news].sort(
    (left, right) =>
      new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime(),
  );
}

const loadTaxonomy = cache(async () => {
  const [tagsRaw, categoriesRaw] = await Promise.all([
    readJson<{ tags: TaxonomyTag[] }>(
      path.join(CONTENT_ROOT, "taxonomy", "tags.json"),
    ),
    readJson<{ categories: TaxonomyCategory[] }>(
      path.join(CONTENT_ROOT, "taxonomy", "categories.json"),
    ),
  ]);

  return {
    tags: tagsRaw.tags.map((tag) => taxonomyTagSchema.parse(tag)),
    categories: categoriesRaw.categories.map((category) =>
      taxonomyCategorySchema.parse(category),
    ),
  };
});

const loadHeroes = cache(async () => {
  const index = await readJson<{ heroes: string[] }>(path.join(HERO_ROOT, "index.json"));
  const heroes = await Promise.all(
    index.heroes.map(async (slug) =>
      heroSchema.parse(await readJson(path.join(HERO_ROOT, slug, "hero.json"))),
    ),
  );

  const heroMap = new Map<string, Hero>();

  heroes.forEach((hero) => {
    if (heroMap.has(hero.slug)) {
      throw new Error(`Duplicate hero slug detected: ${hero.slug}`);
    }

    heroMap.set(hero.slug, hero);
  });

  return heroes;
});

const loadNews = cache(async () => {
  const heroes = await loadHeroes();
  const heroMap = new Map(heroes.map((hero) => [hero.slug, hero]));

  const allNews = (
    await Promise.all(
      heroes.map(async (hero) => {
        const newsDirectory = path.join(HERO_ROOT, hero.slug, "news");
        const exists = await directoryExists(newsDirectory);

        if (!exists) {
          return [] as News[];
        }

        const files = await fs.readdir(newsDirectory);
        const stories = await Promise.all(
          files
            .filter((fileName) => fileName.endsWith(".json"))
            .map(async (fileName) => {
              const story = newsSchema.parse(
                await readJson(path.join(newsDirectory, fileName)),
              );

              if (!heroMap.has(story.heroSlug)) {
                throw new Error(
                  `News item ${story.slug} references missing hero ${story.heroSlug}`,
                );
              }

              return story;
            }),
        );

        return stories;
      }),
    )
  ).flat();

  const uniqueNews = new Map<string, News>();

  allNews.forEach((story) => {
    if (uniqueNews.has(story.slug)) {
      throw new Error(`Duplicate news slug detected: ${story.slug}`);
    }

    uniqueNews.set(story.slug, story);
  });

  return sortByPublishedDate([...uniqueNews.values()]);
});

const loadLatestIndex = cache(async () => {
  return latestIndexSchema.parse(
    await readJson<LatestIndex>(path.join(CONTENT_ROOT, "news", "latest-index.json")),
  );
});

const loadSiteSettings = cache(async () => {
  return siteSettingsSchema.parse(
    await readJson<SiteSettings>(path.join(CONTENT_ROOT, "site", "settings.json")),
  );
});

const loadSoftConfig = cache(async () => {
  return softConfigSchema.parse(
    await readJson<SoftConfig>(path.join(CONTENT_ROOT, "site", "soft.json")),
  );
});

export async function getSiteSettings() {
  return loadSiteSettings();
}

export async function getSoftConfig() {
  return loadSoftConfig();
}

export async function getTaxonomy() {
  return loadTaxonomy();
}

export async function getAllHeroes() {
  const heroes = await loadHeroes();
  return [...heroes].sort((left, right) => left.name.localeCompare(right.name));
}

export async function getFeaturedHeroes() {
  const heroes = await loadHeroes();
  return heroes.filter((hero) => hero.isFeatured);
}

export async function getHeroBySlug(slug: string) {
  const heroes = await loadHeroes();
  return heroes.find((hero) => hero.slug === slug) ?? null;
}

export async function getHeroNews(heroSlug: string, includeDrafts = false) {
  const news = await loadNews();

  return news.filter(
    (story) =>
      story.heroSlug === heroSlug &&
      (includeDrafts ? true : story.status === "published"),
  );
}

export async function getAllNews(includeDrafts = false) {
  const news = await loadNews();
  return includeDrafts ? news : news.filter((story) => story.status === "published");
}

export async function getFeaturedNews() {
  const news = await getAllNews();
  return news.filter((story) => story.isFeatured);
}

export async function getSoftNews() {
  const news = await getAllNews();
  return news.filter((story) => story.isSoft);
}

export async function getTrendingNews() {
  const [news, latestIndex] = await Promise.all([getAllNews(), loadLatestIndex()]);
  const newsMap = new Map(news.map((story) => [story.id, story]));
  return latestIndex.trending
    .map((storyId) => newsMap.get(storyId))
    .filter((story): story is News => Boolean(story));
}

export async function getSpotlightNews() {
  const [news, latestIndex] = await Promise.all([getAllNews(), loadLatestIndex()]);
  const newsMap = new Map(news.map((story) => [story.id, story]));
  return latestIndex.spotlight
    .map((storyId) => newsMap.get(storyId))
    .filter((story): story is News => Boolean(story));
}

export async function getEditorialCollections() {
  const [news, latestIndex] = await Promise.all([getAllNews(), loadLatestIndex()]);
  const newsMap = new Map(news.map((story) => [story.id, story]));

  return latestIndex.collections.map((collection) => ({
    ...collection,
    items: collection.newsIds
      .map((storyId) => newsMap.get(storyId))
      .filter((story): story is News => Boolean(story)),
  }));
}

export async function getNewsBySlug(slug: string, includeDrafts = false) {
  const news = await getAllNews(includeDrafts);
  return news.find((story) => story.slug === slug) ?? null;
}

export async function getRelatedHeroes(hero: Hero) {
  const heroes = await getAllHeroes();

  return heroes
    .filter((candidate) => candidate.slug !== hero.slug)
    .map((candidate) => {
      const sharedTags = candidate.tags.filter((tag) => hero.tags.includes(tag)).length;
      const sharedRoles = candidate.role.filter((role) => hero.role.includes(role)).length;

      return {
        hero: candidate,
        score: sharedTags * 2 + sharedRoles,
      };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
    .map((entry) => entry.hero);
}

export async function getRelatedNews(story: News) {
  const news = await getAllNews();

  return news
    .filter((candidate) => candidate.slug !== story.slug)
    .map((candidate) => {
      let score = 0;
      if (candidate.heroSlug === story.heroSlug) score += 4;
      if (candidate.isSoft === story.isSoft) score += 1;
      score += candidate.tags.filter((tag) => story.tags.includes(tag)).length;

      return { story: candidate, score };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, 4)
    .map((entry) => entry.story);
}

export async function getPreviousNextNews(slug: string) {
  const news = await getAllNews();
  const index = news.findIndex((story) => story.slug === slug);

  if (index === -1) {
    return { previous: null, next: null };
  }

  return {
    previous: news[index + 1] ?? null,
    next: news[index - 1] ?? null,
  };
}

export async function searchContent(query: string) {
  const normalized = query.trim().toLowerCase();
  const [heroes, news, taxonomy] = await Promise.all([
    getAllHeroes(),
    getAllNews(),
    getTaxonomy(),
  ]);

  if (!normalized) {
    return {
      heroes: heroes.slice(0, 6),
      news: news.slice(0, 8),
      tags: taxonomy.tags.slice(0, 8),
    };
  }

  return {
    heroes: heroes.filter((hero) =>
      `${hero.name} ${hero.title} ${hero.excerpt} ${hero.tags.join(" ")}`
        .toLowerCase()
        .includes(normalized),
    ),
    news: news.filter((story) =>
      `${story.title} ${story.excerpt} ${story.tags.join(" ")} ${story.category}`
        .toLowerCase()
        .includes(normalized),
    ),
    tags: taxonomy.tags.filter((tag) =>
      `${tag.label} ${tag.slug}`.toLowerCase().includes(normalized),
    ),
  };
}

export async function getPortalSnapshot() {
  const [settings, softConfig, heroes, news, trending, spotlight, collections] =
    await Promise.all([
      getSiteSettings(),
      getSoftConfig(),
      getFeaturedHeroes(),
      getFeaturedNews(),
      getTrendingNews(),
      getSpotlightNews(),
      getEditorialCollections(),
    ]);

  return {
    settings,
    softConfig,
    featuredHeroes: heroes,
    featuredNews: news,
    trending,
    spotlight,
    collections,
  };
}

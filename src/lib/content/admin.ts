import { promises as fs } from "fs";
import path from "path";

import {
  parsePortalBundle,
  siteBundleSchema,
  taxonomyPayloadSchema,
  type PortalBundle,
  type SiteBundle,
  type TaxonomyPayload,
} from "@/lib/content/bundle";
import {
  heroSchema,
  latestIndexSchema,
  newsSchema,
  type Hero,
  type LatestIndex,
  type News,
} from "@/lib/content/schemas";
import {
  getAllHeroes,
  getAllNews,
  getHeroBySlug,
  getLatestIndex,
  getSiteSettings,
  getSoftConfig,
  getTaxonomy,
} from "@/lib/content/repository";
import { getContentRoot } from "@/lib/content/paths";
import { slugify, unique } from "@/lib/utils";

const CONTENT_ROOT = getContentRoot();
const HERO_ROOT = path.join(CONTENT_ROOT, "heroes");
const TAXONOMY_ROOT = path.join(CONTENT_ROOT, "taxonomy");
const SITE_ROOT = path.join(CONTENT_ROOT, "site");
const NEWS_ROOT = path.join(CONTENT_ROOT, "news");

function createJsonOutput(value: unknown) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

async function ensureDirectory(targetPath: string) {
  await fs.mkdir(targetPath, { recursive: true });
}

function createUniqueCopyValue(source: string, taken: Set<string>) {
  const base = `${source}-copy`;

  if (!taken.has(base)) {
    return base;
  }

  let suffix = 2;
  let candidate = `${base}-${suffix}`;

  while (taken.has(candidate)) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }

  return candidate;
}

export interface PortalExportSnapshot {
  exportedAt: string;
  heroes: Hero[];
  news: News[];
  taxonomy: TaxonomyPayload;
  site: SiteBundle;
  latestIndex: LatestIndex;
}

export function parseNewsImportPayload(payload: unknown) {
  return parsePortalBundle(payload).news;
}

export function parseTaxonomyPayload(payload: unknown) {
  return taxonomyPayloadSchema.parse(payload);
}

export function parsePortalImportPayload(payload: unknown) {
  return parsePortalBundle(payload);
}

function assertUnique(values: string[], label: string) {
  const duplicates = values.filter((value, index) => values.indexOf(value) !== index);

  if (duplicates.length) {
    throw new Error(`Duplicate ${label} detected: ${unique(duplicates).join(", ")}`);
  }
}

export function validatePortalBundleGraph(
  bundle: PortalBundle,
  existing: {
    heroes: Hero[];
    news: News[];
    taxonomy: TaxonomyPayload;
  },
) {
  assertUnique(
    bundle.heroes.map((hero) => hero.slug),
    "hero slug",
  );
  assertUnique(
    bundle.news.map((story) => story.slug),
    "news slug",
  );
  assertUnique(
    bundle.news.map((story) => story.id),
    "news id",
  );

  if (bundle.taxonomy) {
    assertUnique(
      bundle.taxonomy.tags.map((tag) => tag.slug),
      "taxonomy tag slug",
    );
    assertUnique(
      bundle.taxonomy.categories.map((category) => category.slug),
      "taxonomy category slug",
    );
  }

  const heroSlugs = new Set([
    ...existing.heroes.map((hero) => hero.slug),
    ...bundle.heroes.map((hero) => hero.slug),
  ]);
  const newsIds = new Set([
    ...existing.news.map((story) => story.id),
    ...bundle.news.map((story) => story.id),
  ]);
  const tagSlugs = new Set([
    ...existing.taxonomy.tags.map((tag) => tag.slug),
    ...(bundle.taxonomy?.tags.map((tag) => tag.slug) ?? []),
  ]);
  const categorySlugs = new Set([
    ...existing.taxonomy.categories.map((category) => category.slug),
    ...(bundle.taxonomy?.categories.map((category) => category.slug) ?? []),
  ]);

  bundle.heroes.forEach((hero) => {
    const missingTags = hero.tags.filter((tag) => !tagSlugs.has(tag));

    if (missingTags.length) {
      throw new Error(
        `Hero ${hero.slug} references missing taxonomy tags: ${missingTags.join(", ")}`,
      );
    }
  });

  bundle.news.forEach((story) => {
    if (!heroSlugs.has(story.heroSlug)) {
      throw new Error(`News item ${story.slug} references missing hero ${story.heroSlug}`);
    }

    if (!categorySlugs.has(story.category)) {
      throw new Error(
        `News item ${story.slug} references missing category ${story.category}`,
      );
    }

    const missingTags = story.tags.filter((tag) => !tagSlugs.has(tag));

    if (missingTags.length) {
      throw new Error(
        `News item ${story.slug} references missing taxonomy tags: ${missingTags.join(", ")}`,
      );
    }
  });

  if (bundle.site) {
    const missingPriorityHeroes = bundle.site.soft.heroPriority.filter(
      (heroSlug) => !heroSlugs.has(heroSlug),
    );

    if (missingPriorityHeroes.length) {
      throw new Error(
        `SOFT config references missing heroes: ${missingPriorityHeroes.join(", ")}`,
      );
    }
  }

  if (bundle.latestIndex) {
    const referencedIds = [
      ...bundle.latestIndex.featured,
      ...bundle.latestIndex.trending,
      ...bundle.latestIndex.spotlight,
      ...bundle.latestIndex.collections.flatMap((collection) => collection.newsIds),
    ];
    const missingIds = unique(
      referencedIds.filter((storyId) => !newsIds.has(storyId)),
    );

    if (missingIds.length) {
      throw new Error(
        `Latest index references missing news ids: ${missingIds.join(", ")}`,
      );
    }
  }
}

export function createDuplicateNewsPayload(stories: News[], slug: string) {
  const existing = stories.find((story) => story.slug === slug);

  if (!existing) {
    throw new Error(`Cannot duplicate missing news item: ${slug}`);
  }

  const duplicateSlug = createUniqueCopyValue(
    existing.slug,
    new Set(stories.map((story) => story.slug)),
  );
  const duplicateId = createUniqueCopyValue(
    existing.id,
    new Set(stories.map((story) => story.id)),
  );

  return newsSchema.parse({
    ...existing,
    id: duplicateId,
    slug: duplicateSlug,
    title: `${existing.title} Copy`,
    status: "draft",
    publishedAt: new Date().toISOString(),
  });
}

export async function saveNewsPayload(
  payload: News,
  options?: { heroSlugs?: Set<string> },
) {
  const parsed = newsSchema.parse(payload);
  const heroExists = options?.heroSlugs
    ? options.heroSlugs.has(parsed.heroSlug)
    : Boolean(await getHeroBySlug(parsed.heroSlug));

  if (!heroExists) {
    throw new Error(`Cannot save news item for missing hero: ${parsed.heroSlug}`);
  }

  const dayPrefix = parsed.publishedAt.slice(0, 10);
  const directory = path.join(HERO_ROOT, parsed.heroSlug, "news");
  const filePath = path.join(directory, `${dayPrefix}-${parsed.slug}.json`);

  await ensureDirectory(directory);
  await fs.writeFile(filePath, createJsonOutput(parsed), "utf8");

  return filePath;
}

export async function duplicateNewsBySlug(slug: string) {
  const stories = await getAllNews(true);
  const duplicate = createDuplicateNewsPayload(stories, slug);

  await saveNewsPayload(duplicate);
  return duplicate;
}

export async function importNewsBatch(
  payloads: News[],
  options?: { heroSlugs?: Set<string> },
) {
  const parsed = payloads.map((payload) => newsSchema.parse(payload));

  await Promise.all(parsed.map((story) => saveNewsPayload(story, options)));

  return parsed.length;
}

async function saveHeroIndex(slugs: string[]) {
  await ensureDirectory(HERO_ROOT);
  const orderedSlugs = [...unique(slugs)].sort((left, right) => left.localeCompare(right));

  await fs.writeFile(
    path.join(HERO_ROOT, "index.json"),
    createJsonOutput({ heroes: orderedSlugs }),
    "utf8",
  );
}

export async function saveHeroPayload(payload: Hero) {
  const parsed = heroSchema.parse(payload);
  const directory = path.join(HERO_ROOT, parsed.slug);

  await ensureDirectory(directory);
  await fs.writeFile(
    path.join(directory, "hero.json"),
    createJsonOutput(parsed),
    "utf8",
  );

  return path.join(directory, "hero.json");
}

export async function importHeroBatch(payloads: Hero[]) {
  const parsed = payloads.map((payload) => heroSchema.parse(payload));
  const existingHeroes = await getAllHeroes();

  await Promise.all(parsed.map((hero) => saveHeroPayload(hero)));
  await saveHeroIndex([...existingHeroes.map((hero) => hero.slug), ...parsed.map((hero) => hero.slug)]);

  return parsed.length;
}

export async function saveTaxonomyPayload(payload: TaxonomyPayload) {
  const parsed = parseTaxonomyPayload(payload);

  await ensureDirectory(TAXONOMY_ROOT);
  await Promise.all([
    fs.writeFile(
      path.join(TAXONOMY_ROOT, "tags.json"),
      createJsonOutput({ tags: parsed.tags }),
      "utf8",
    ),
    fs.writeFile(
      path.join(TAXONOMY_ROOT, "categories.json"),
      createJsonOutput({ categories: parsed.categories }),
      "utf8",
    ),
  ]);

  return {
    tagsPath: path.join(TAXONOMY_ROOT, "tags.json"),
    categoriesPath: path.join(TAXONOMY_ROOT, "categories.json"),
  };
}

export async function saveSiteBundlePayload(payload: SiteBundle) {
  const parsed = siteBundleSchema.parse(payload);

  await ensureDirectory(SITE_ROOT);
  await Promise.all([
    fs.writeFile(
      path.join(SITE_ROOT, "settings.json"),
      createJsonOutput(parsed.settings),
      "utf8",
    ),
    fs.writeFile(
      path.join(SITE_ROOT, "soft.json"),
      createJsonOutput(parsed.soft),
      "utf8",
    ),
  ]);

  return {
    settingsPath: path.join(SITE_ROOT, "settings.json"),
    softPath: path.join(SITE_ROOT, "soft.json"),
  };
}

export async function saveLatestIndexPayload(payload: LatestIndex) {
  const parsed = latestIndexSchema.parse(payload);

  await ensureDirectory(NEWS_ROOT);
  await fs.writeFile(
    path.join(NEWS_ROOT, "latest-index.json"),
    createJsonOutput(parsed),
    "utf8",
  );

  return path.join(NEWS_ROOT, "latest-index.json");
}

export async function exportPortalSnapshot() {
  const [heroes, stories, taxonomy, settings, soft, latestIndex] = await Promise.all([
    getAllHeroes(),
    getAllNews(true),
    getTaxonomy(),
    getSiteSettings(),
    getSoftConfig(),
    getLatestIndex(),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    heroes,
    news: stories,
    taxonomy,
    site: {
      settings,
      soft,
    },
    latestIndex,
  } satisfies PortalExportSnapshot;
}

export async function importPortalBundle(payload: PortalBundle) {
  const existing = await Promise.all([getAllHeroes(), getAllNews(true), getTaxonomy()]);
  const [heroes, news, taxonomy] = existing;

  validatePortalBundleGraph(payload, { heroes, news, taxonomy });
  const mergedHeroSlugs = new Set([
    ...heroes.map((hero) => hero.slug),
    ...payload.heroes.map((hero) => hero.slug),
  ]);

  const counts = {
    heroes: 0,
    news: 0,
    tags: payload.taxonomy?.tags.length ?? 0,
    categories: payload.taxonomy?.categories.length ?? 0,
    siteSettings: payload.site ? 1 : 0,
    softConfig: payload.site ? 1 : 0,
    latestIndex: payload.latestIndex ? 1 : 0,
  };

  if (payload.heroes.length) {
    counts.heroes = await importHeroBatch(payload.heroes);
  }

  if (payload.news.length) {
    counts.news = await importNewsBatch(payload.news, { heroSlugs: mergedHeroSlugs });
  }

  if (payload.taxonomy) {
    await saveTaxonomyPayload(payload.taxonomy);
  }

  if (payload.site) {
    await saveSiteBundlePayload(payload.site);
  }

  if (payload.latestIndex) {
    await saveLatestIndexPayload(payload.latestIndex);
  }

  return counts;
}

export function createQuickDraft(values: {
  heroSlug: string;
  title: string;
  excerpt: string;
  contentMarkdown: string;
  isSoft?: boolean;
}) {
  const slug = slugify(values.title);
  const id = `${new Date().toISOString().slice(0, 10)}-${slug}`;

  return newsSchema.parse({
    id,
    slug,
    title: values.title,
    excerpt: values.excerpt,
    heroSlug: values.heroSlug,
    cover: `/images/heroes/${values.heroSlug}/cover.svg`,
    status: "draft",
    isSoft: values.isSoft ?? false,
    isFeatured: false,
    category: values.isSoft ? "editorial" : "news",
    tags: values.isSoft ? ["soft"] : [],
    author: "Admin",
    publishedAt: new Date().toISOString(),
    readingTime: Math.max(1, Math.ceil(values.contentMarkdown.split(/\s+/).length / 220)),
    seo: {
      title: `${values.title} - MLBB Portal`,
      description: values.excerpt,
    },
    contentMarkdown: values.contentMarkdown,
  });
}

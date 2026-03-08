import { promises as fs } from "fs";
import path from "path";

import { heroSchema, newsSchema, type Hero, type News } from "@/lib/content/schemas";
import { getAllNews, getHeroBySlug } from "@/lib/content/repository";
import { slugify } from "@/lib/utils";

const HERO_ROOT = path.join(process.cwd(), "content", "heroes");

function createJsonOutput(value: unknown) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

async function ensureDirectory(targetPath: string) {
  await fs.mkdir(targetPath, { recursive: true });
}

export async function saveNewsPayload(payload: News) {
  const parsed = newsSchema.parse(payload);
  const hero = await getHeroBySlug(parsed.heroSlug);

  if (!hero) {
    throw new Error(`Cannot save news item for missing hero: ${parsed.heroSlug}`);
  }

  const dayPrefix = parsed.publishedAt.slice(0, 10);
  const directory = path.join(HERO_ROOT, hero.slug, "news");
  const filePath = path.join(directory, `${dayPrefix}-${parsed.slug}.json`);

  await ensureDirectory(directory);
  await fs.writeFile(filePath, createJsonOutput(parsed), "utf8");

  return filePath;
}

export async function duplicateNewsBySlug(slug: string) {
  const stories = await getAllNews(true);
  const existing = stories.find((story) => story.slug === slug);

  if (!existing) {
    throw new Error(`Cannot duplicate missing news item: ${slug}`);
  }

  const duplicate = newsSchema.parse({
    ...existing,
    id: `${existing.id}-copy`,
    slug: `${existing.slug}-copy`,
    title: `${existing.title} Copy`,
    status: "draft",
    publishedAt: new Date().toISOString(),
  });

  await saveNewsPayload(duplicate);
  return duplicate;
}

export async function importNewsBatch(payloads: News[]) {
  const parsed = payloads.map((payload) => newsSchema.parse(payload));

  await Promise.all(parsed.map((story) => saveNewsPayload(story)));

  return parsed.length;
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

export async function exportPortalSnapshot() {
  const stories = await getAllNews(true);

  return {
    exportedAt: new Date().toISOString(),
    news: stories,
  };
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

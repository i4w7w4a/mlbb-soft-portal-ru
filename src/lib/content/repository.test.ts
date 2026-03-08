import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";

import { ZodError } from "zod";

import {
  createContentRepository,
  getAllHeroes,
  getAllNews,
  getHeroBySlug,
  getNewsBySlug,
  getSoftNews,
  searchContent,
} from "@/lib/content/repository";
import { newsSchema } from "@/lib/content/schemas";
import type { Hero, News } from "@/lib/content/schemas";
import type { ContentRepository } from "@/lib/content/repository";

const baseHero: Hero = {
  id: "alpha",
  slug: "alpha",
  name: "Alpha",
  title: "Test Hero",
  role: ["Mage"],
  lane: ["Mid"],
  specialty: ["Poke"],
  excerpt: "Fixture hero profile.",
  avatar: "/images/heroes/alpha/avatar.svg",
  cover: "/images/heroes/alpha/cover.svg",
  isFeatured: false,
  isSoftFeatured: false,
  tags: ["mage", "mid"],
  faction: "Test Faction",
  signature: "Keep lane control.",
  difficulty: "Medium",
  releaseYear: 2024,
  accent: "#6ee7ff",
  seo: {
    title: "Alpha MLBB coverage",
    description: "Fixture SEO description for Alpha.",
  },
};

const baseNews: News = {
  id: "2026-03-08-alpha-update",
  slug: "alpha-update",
  title: "Alpha Update",
  excerpt: "Fixture story excerpt.",
  heroSlug: "alpha",
  cover: "/images/heroes/alpha/cover.svg",
  status: "published",
  isSoft: false,
  isFeatured: false,
  category: "news",
  tags: ["mage", "meta"],
  author: "Fixture Desk",
  publishedAt: "2026-03-08T10:00:00.000Z",
  readingTime: 3,
  seo: {
    title: "Alpha Update - MLBB Portal",
    description: "Fixture news SEO description.",
  },
  contentMarkdown: "# Fixture story\n\nBody copy.",
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

async function writeJson(filePath: string, value: unknown) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function createFixtureRoot(options: {
  heroIndex: string[];
  heroes: Record<string, unknown>;
  news?: Record<string, Array<{ fileName: string; payload: unknown }>>;
}) {
  const root = await mkdtemp(path.join(os.tmpdir(), "mlbb-content-fixture-"));
  const contentRoot = path.join(root, "content");

  await writeJson(path.join(contentRoot, "heroes", "index.json"), {
    heroes: options.heroIndex,
  });

  await Promise.all(
    Object.entries(options.heroes).map(([directorySlug, payload]) =>
      writeJson(path.join(contentRoot, "heroes", directorySlug, "hero.json"), payload),
    ),
  );

  await Promise.all(
    Object.entries(options.news ?? {}).flatMap(([directorySlug, stories]) =>
      stories.map((story) =>
        writeJson(
          path.join(contentRoot, "heroes", directorySlug, "news", story.fileName),
          story.payload,
        ),
      ),
    ),
  );

  return root;
}

async function withRepositoryFixture<T>(
  options: Parameters<typeof createFixtureRoot>[0],
  run: (repository: ContentRepository) => Promise<T>,
) {
  const root = await createFixtureRoot(options);

  try {
    const repository = createContentRepository({
      contentRoot: path.join(root, "content"),
    });
    return await run(repository);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test("loads heroes and news from the JSON-first repository", async () => {
  const [heroes, news] = await Promise.all([getAllHeroes(), getAllNews(true)]);

  assert.equal(heroes.length, 6);
  assert.equal(news.length, 12);
});

test("resolves hero and news by slug", async () => {
  const [hero, story] = await Promise.all([
    getHeroBySlug("aamon"),
    getNewsBySlug("aamon-patch-analysis"),
  ]);

  assert.equal(hero?.name, "Aamon");
  assert.equal(story?.heroSlug, "aamon");
});

test("finds SOFT content and search matches", async () => {
  const [softStories, search] = await Promise.all([
    getSoftNews(),
    searchContent("xavier"),
  ]);

  assert.ok(softStories.length >= 4);
  assert.ok(search.heroes.some((hero) => hero.slug === "xavier"));
});

test("rejects duplicate hero slugs in the repository layer", async () => {
  await withRepositoryFixture(
    {
      heroIndex: ["alpha", "beta"],
      heroes: {
        alpha: clone(baseHero),
        beta: {
          ...clone(baseHero),
          name: "Beta",
          title: "Duplicate Slug Carrier",
        },
      },
    },
    async (repository) => {
      await assert.rejects(
        () => repository.getAllHeroes(),
        /Duplicate hero slug detected: alpha/,
      );
    },
  );
});

test("rejects duplicate news slugs across hero directories", async () => {
  await withRepositoryFixture(
    {
      heroIndex: ["alpha", "beta"],
      heroes: {
        alpha: clone(baseHero),
        beta: {
          ...clone(baseHero),
          id: "beta",
          slug: "beta",
          name: "Beta",
          avatar: "/images/heroes/beta/avatar.svg",
          cover: "/images/heroes/beta/cover.svg",
          seo: {
            title: "Beta MLBB coverage",
            description: "Fixture SEO description for Beta.",
          },
        },
      },
      news: {
        alpha: [{ fileName: "2026-03-08-alpha-update.json", payload: clone(baseNews) }],
        beta: [
          {
            fileName: "2026-03-09-beta-update.json",
            payload: {
              ...clone(baseNews),
              id: "2026-03-09-beta-update",
              heroSlug: "beta",
            },
          },
        ],
      },
    },
    async (repository) => {
      await assert.rejects(
        () => repository.getAllNews(true),
        /Duplicate news slug detected: alpha-update/,
      );
    },
  );
});

test("rejects news payloads that reference a missing hero", async () => {
  await withRepositoryFixture(
    {
      heroIndex: ["alpha"],
      heroes: {
        alpha: clone(baseHero),
      },
      news: {
        alpha: [
          {
            fileName: "2026-03-08-broken-reference.json",
            payload: {
              ...clone(baseNews),
              id: "2026-03-08-broken-reference",
              slug: "broken-reference",
              heroSlug: "ghost",
            },
          },
        ],
      },
    },
    async (repository) => {
      await assert.rejects(
        () => repository.getAllNews(true),
        /references missing hero ghost/,
      );
    },
  );
});

test("surfaces schema validation errors for malformed hero payloads", async () => {
  await withRepositoryFixture(
    {
      heroIndex: ["alpha"],
      heroes: {
        alpha: {
          ...clone(baseHero),
          releaseYear: "2024",
        },
      },
    },
    async (repository) => {
      await assert.rejects(() => repository.getAllHeroes(), (error: unknown) => {
        assert.ok(error instanceof ZodError);
        assert.ok(error.issues.some((issue) => issue.path.join(".") === "releaseYear"));
        return true;
      });
    },
  );
});

test("rejects invalid ISO-like news dates at schema level", () => {
  const result = newsSchema.safeParse({
    ...clone(baseNews),
    publishedAt: "2026-99-99T25:61:00Z",
  });

  assert.equal(result.success, false);
  assert.match(result.error.issues[0]?.message ?? "", /Invalid date value/);
});

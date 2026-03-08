import assert from "node:assert/strict";
import test from "node:test";

import {
  createDuplicateNewsPayload,
  parsePortalImportPayload,
  parseNewsImportPayload,
  parseTaxonomyPayload,
  validatePortalBundleGraph,
} from "@/lib/content/admin";
import {
  heroSchema,
  latestIndexSchema,
  newsSchema,
  siteSettingsSchema,
  softConfigSchema,
  type Hero,
  type News,
} from "@/lib/content/schemas";

function createStory(overrides: Partial<News> = {}) {
  return newsSchema.parse({
    id: "2026-03-08-aamon-patch-analysis",
    slug: "aamon-patch-analysis",
    title: "Aamon Patch Analysis",
    excerpt: "Short teaser",
    heroSlug: "aamon",
    cover: "/images/heroes/aamon/cover.svg",
    status: "published",
    isSoft: false,
    isFeatured: false,
    category: "patch-analysis",
    tags: ["patch", "meta"],
    author: "Admin",
    publishedAt: "2026-03-08T10:00:00.000Z",
    readingTime: 4,
    seo: {
      title: "Aamon Patch Analysis - MLBB Portal",
      description: "Short teaser",
    },
    contentMarkdown: "# Heading\n\nBody copy.",
    ...overrides,
  });
}

function createHero(overrides: Partial<Hero> = {}) {
  return heroSchema.parse({
    id: "aamon",
    slug: "aamon",
    name: "Aamon",
    title: "Duke of Shards",
    role: ["Assassin"],
    lane: ["Jungle"],
    specialty: ["Chase", "Burst"],
    excerpt: "Short hero profile",
    avatar: "/images/heroes/aamon/avatar.svg",
    cover: "/images/heroes/aamon/cover.svg",
    isFeatured: true,
    isSoftFeatured: true,
    tags: ["assassin", "jungle"],
    faction: "House Paxley",
    signature: "Invisible burst routing",
    difficulty: "High",
    releaseYear: 2021,
    accent: "#65e6ff",
    seo: {
      title: "Aamon MLBB News, Guides and Updates",
      description: "Latest news and updates about Aamon.",
    },
    ...overrides,
  });
}

test("parseNewsImportPayload accepts exported snapshots", () => {
  const story = createStory();
  const stories = parseNewsImportPayload({
    exportedAt: "2026-03-08T12:00:00.000Z",
    news: [story],
  });

  assert.equal(stories.length, 1);
  assert.equal(stories[0]?.slug, story.slug);
});

test("parseNewsImportPayload rejects unsupported payload shapes", () => {
  assert.throws(
    () => parseNewsImportPayload({ items: [createStory()] }),
    /content sections/i,
  );
});

test("createDuplicateNewsPayload increments copy suffixes safely", () => {
  const source = createStory();
  const existingCopy = createStory({
    id: "2026-03-08-aamon-patch-analysis-copy",
    slug: "aamon-patch-analysis-copy",
    title: "Aamon Patch Analysis Copy",
    status: "draft",
  });

  const duplicate = createDuplicateNewsPayload([source, existingCopy], source.slug);

  assert.equal(duplicate.slug, "aamon-patch-analysis-copy-2");
  assert.equal(duplicate.id, "2026-03-08-aamon-patch-analysis-copy-2");
  assert.equal(duplicate.status, "draft");
  assert.ok(duplicate.publishedAt.endsWith("Z"));
});

test("parseTaxonomyPayload validates tags and categories together", () => {
  const taxonomy = parseTaxonomyPayload({
    tags: [{ slug: "soft-focus", label: "Soft Focus", kind: "topic" }],
    categories: [{ slug: "meta-watch", label: "Meta Watch" }],
  });

  assert.equal(taxonomy.tags[0]?.slug, "soft-focus");
  assert.equal(taxonomy.categories[0]?.label, "Meta Watch");
});

test("parsePortalImportPayload accepts full content bundles", () => {
  const bundle = parsePortalImportPayload({
    exportedAt: "2026-03-08T12:00:00.000Z",
    heroes: [createHero()],
    news: [createStory()],
    taxonomy: {
      tags: [
        { slug: "assassin", label: "Assassin", kind: "role" },
        { slug: "jungle", label: "Jungle", kind: "lane" },
        { slug: "patch", label: "Patch", kind: "topic" },
        { slug: "meta", label: "Meta", kind: "topic" },
      ],
      categories: [{ slug: "patch-analysis", label: "Patch Analysis" }],
    },
    site: {
      settings: siteSettingsSchema.parse({
        siteName: "SOFT Rift",
        siteTagline: "Tagline",
        siteDescription: "Description",
        defaultOgImage: "/opengraph-image",
        primaryNav: [{ label: "Home", href: "/" }],
      }),
      soft: softConfigSchema.parse({
        slug: "soft",
        label: "SOFT",
        headline: "Headline",
        description: "Description",
        ctaLabel: "Enter SOFT",
        manifesto: ["Signal first"],
        heroPriority: ["aamon"],
      }),
    },
    latestIndex: latestIndexSchema.parse({
      featured: ["2026-03-08-aamon-patch-analysis"],
      trending: ["2026-03-08-aamon-patch-analysis"],
      spotlight: [],
      collections: [],
    }),
  });

  assert.equal(bundle.heroes.length, 1);
  assert.equal(bundle.news.length, 1);
  assert.equal(bundle.taxonomy?.tags.length, 4);
  assert.equal(bundle.site?.soft.heroPriority[0], "aamon");
});

test("parsePortalImportPayload rejects empty bundles", () => {
  assert.throws(() => parsePortalImportPayload({}), /content sections/i);
});

test("validatePortalBundleGraph rejects missing taxonomy links", () => {
  const bundle = parsePortalImportPayload({
    heroes: [createHero({ tags: ["assassin", "ghost-tag"] })],
    taxonomy: {
      tags: [
        { slug: "assassin", label: "Assassin", kind: "role" },
        { slug: "jungle", label: "Jungle", kind: "lane" },
      ],
      categories: [{ slug: "patch-analysis", label: "Patch Analysis" }],
    },
  });

  assert.throws(
    () =>
      validatePortalBundleGraph(bundle, {
        heroes: [],
        news: [],
        taxonomy: { tags: [], categories: [] },
      }),
    /missing taxonomy tags/i,
  );
});

test("validatePortalBundleGraph rejects broken latest index references", () => {
  const bundle = parsePortalImportPayload({
    latestIndex: {
      featured: ["missing-story-id"],
      trending: [],
      spotlight: [],
      collections: [],
    },
  });

  assert.throws(
    () =>
      validatePortalBundleGraph(bundle, {
        heroes: [createHero()],
        news: [createStory()],
        taxonomy: {
          tags: [
            { slug: "assassin", label: "Assassin", kind: "role" },
            { slug: "jungle", label: "Jungle", kind: "lane" },
            { slug: "patch", label: "Patch", kind: "topic" },
            { slug: "meta", label: "Meta", kind: "topic" },
          ],
          categories: [{ slug: "patch-analysis", label: "Patch Analysis" }],
        },
      }),
    /latest index references missing news ids/i,
  );
});

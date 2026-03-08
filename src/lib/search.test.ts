import assert from "node:assert/strict";
import test from "node:test";

import { heroSchema, newsSchema, taxonomyTagSchema, type Hero, type News, type TaxonomyTag } from "@/lib/content/schemas";
import { createSearchSuggestions, rankSearchContent } from "@/lib/search";

function createHero(overrides: Partial<Hero> = {}) {
  return heroSchema.parse({
    id: "aamon",
    slug: "aamon",
    name: "Aamon",
    title: "Duke of Shards",
    role: ["Assassin"],
    lane: ["Jungle"],
    specialty: ["Chase", "Burst"],
    excerpt: "Invisible jungle burst specialist.",
    avatar: "/images/heroes/aamon/avatar.svg",
    cover: "/images/heroes/aamon/cover.svg",
    isFeatured: true,
    isSoftFeatured: true,
    tags: ["assassin", "jungle"],
    faction: "House Paxley",
    signature: "Invisible resets",
    difficulty: "High",
    releaseYear: 2021,
    accent: "#65e6ff",
    seo: {
      title: "Aamon MLBB News, Guides and Updates",
      description: "Latest Aamon coverage.",
    },
    ...overrides,
  });
}

function createStory(overrides: Partial<News> = {}) {
  return newsSchema.parse({
    id: "2026-03-08-aamon-patch-analysis",
    slug: "aamon-patch-analysis",
    title: "Aamon Patch Analysis",
    excerpt: "Why the latest tempo tweaks matter.",
    heroSlug: "aamon",
    cover: "/images/news/aamon-patch-analysis.svg",
    status: "published",
    isSoft: true,
    isFeatured: true,
    category: "patch-analysis",
    tags: ["patch", "meta", "soft"],
    author: "Admin",
    publishedAt: "2026-03-08T10:00:00.000Z",
    readingTime: 4,
    seo: {
      title: "Aamon Patch Analysis - MLBB Portal",
      description: "Why the latest tempo tweaks matter.",
    },
    contentMarkdown: "# Heading\n\nBody copy.",
    ...overrides,
  });
}

function createTag(overrides: Partial<TaxonomyTag> = {}) {
  return taxonomyTagSchema.parse({
    slug: "soft",
    label: "SOFT",
    kind: "product",
    ...overrides,
  });
}

test("rankSearchContent prioritizes exact hero matches", () => {
  const results = rankSearchContent({
    query: "aamon",
    heroes: [
      createHero(),
      createHero({ id: "xavier", slug: "xavier", name: "Xavier", title: "Defier of Light", tags: ["mage", "mid"], role: ["Mage"], lane: ["Mid"], excerpt: "Long-range mage." }),
    ],
    news: [createStory()],
    tags: [createTag()],
  });

  assert.equal(results.heroes[0]?.slug, "aamon");
});

test("rankSearchContent boosts SOFT stories for soft queries", () => {
  const results = rankSearchContent({
    query: "soft",
    heroes: [createHero()],
    news: [
      createStory(),
      createStory({
        id: "2026-03-08-aamon-jungle-routing",
        slug: "aamon-jungle-routing",
        title: "Aamon Jungle Routing",
        isSoft: false,
        isFeatured: false,
        tags: ["jungle"],
      }),
    ],
    tags: [createTag()],
  });

  assert.equal(results.news[0]?.slug, "aamon-patch-analysis");
  assert.equal(results.tags[0]?.slug, "soft");
});

test("createSearchSuggestions combines featured heroes and editorial tags", () => {
  const suggestions = createSearchSuggestions({
    heroes: [
      createHero(),
      createHero({ id: "fredrinn", slug: "fredrinn", name: "Fredrinn", title: "Rogue Appraiser", tags: ["tank"], role: ["Tank"], lane: ["Jungle"], specialty: ["Damage"], excerpt: "Frontline tempo." }),
    ],
    tags: [
      createTag(),
      createTag({ slug: "patch", label: "Patch", kind: "topic" }),
      createTag({ slug: "meta", label: "Meta", kind: "topic" }),
    ],
  });

  assert.ok(suggestions.includes("Aamon"));
  assert.ok(suggestions.includes("SOFT"));
  assert.ok(suggestions.includes("Patch"));
});

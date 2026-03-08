import assert from "node:assert/strict";
import test from "node:test";

import {
  createDuplicateNewsPayload,
  parseNewsImportPayload,
} from "@/lib/content/admin";
import { newsSchema, type News } from "@/lib/content/schemas";

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
    /news/i,
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

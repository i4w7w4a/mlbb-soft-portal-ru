import test from "node:test";
import assert from "node:assert/strict";

import {
  getAllHeroes,
  getAllNews,
  getHeroBySlug,
  getNewsBySlug,
  getSoftNews,
  searchContent,
} from "@/lib/content/repository";

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


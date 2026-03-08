import assert from "node:assert/strict";
import test from "node:test";

import {
  createHeroExplorerSearchParams,
  createNewsExplorerSearchParams,
  parseHeroExplorerFilters,
  parseNewsExplorerFilters,
} from "@/lib/explorer-filters";

test("parseHeroExplorerFilters normalizes invalid params back to defaults", () => {
  const filters = parseHeroExplorerFilters(
    {
      q: "  aamon  ",
      role: "Ghost",
      lane: "Jungle",
      layout: "list",
      sort: "alpha",
    },
    {
      roles: ["Assassin", "Mage"],
      lanes: ["Jungle", "Mid"],
    },
  );

  assert.deepEqual(filters, {
    query: "aamon",
    role: "all",
    lane: "Jungle",
    layout: "list",
    sort: "alpha",
  });
});

test("createHeroExplorerSearchParams omits default values", () => {
  const params = createHeroExplorerSearchParams({
    query: "",
    role: "all",
    lane: "all",
    layout: "grid",
    sort: "featured",
  });

  assert.equal(params.toString(), "");
});

test("parseNewsExplorerFilters reads soft mode and option filters", () => {
  const filters = parseNewsExplorerFilters(
    {
      q: "  patch  ",
      hero: "aamon",
      category: "patch-analysis",
      soft: "1",
    },
    {
      heroSlugs: ["aamon", "xavier"],
      categories: ["patch-analysis", "editorial"],
    },
  );

  assert.deepEqual(filters, {
    query: "patch",
    heroSlug: "aamon",
    category: "patch-analysis",
    softOnly: true,
  });
});

test("createNewsExplorerSearchParams serializes only active filters", () => {
  const params = createNewsExplorerSearchParams({
    query: "soft",
    heroSlug: "all",
    category: "editorial",
    softOnly: true,
  });

  assert.equal(params.get("q"), "soft");
  assert.equal(params.get("category"), "editorial");
  assert.equal(params.get("soft"), "1");
  assert.equal(params.has("hero"), false);
});

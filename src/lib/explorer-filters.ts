import type { ReadonlyURLSearchParams } from "next/navigation";

import type { Hero, News } from "@/lib/content/schemas";

type SearchParamRecord = Record<string, string | string[] | undefined>;
type SearchParamInput =
  | URLSearchParams
  | ReadonlyURLSearchParams
  | SearchParamRecord;

export const heroLayoutValues = ["grid", "list"] as const;
export const heroSortValues = ["featured", "alpha", "release"] as const;

export type HeroExplorerLayout = (typeof heroLayoutValues)[number];
export type HeroExplorerSort = (typeof heroSortValues)[number];

export interface HeroExplorerFilters {
  query: string;
  role: string;
  lane: string;
  layout: HeroExplorerLayout;
  sort: HeroExplorerSort;
}

export interface NewsExplorerFilters {
  query: string;
  heroSlug: string;
  category: string;
  softOnly: boolean;
}

export const defaultHeroExplorerFilters: HeroExplorerFilters = {
  query: "",
  role: "all",
  lane: "all",
  layout: "grid",
  sort: "featured",
};

export const defaultNewsExplorerFilters: NewsExplorerFilters = {
  query: "",
  heroSlug: "all",
  category: "all",
  softOnly: false,
};

function hasSearchParamGetter(
  input: SearchParamInput,
): input is URLSearchParams | ReadonlyURLSearchParams {
  return typeof (input as URLSearchParams | ReadonlyURLSearchParams).get === "function";
}

function readParam(input: SearchParamInput, key: string) {
  if (hasSearchParamGetter(input)) {
    return input.get(key) ?? undefined;
  }

  const value = input[key];
  return Array.isArray(value) ? value[0] : value;
}

function normalizeQuery(value: string | undefined) {
  return value?.trim() ?? "";
}

function normalizeOption<T extends string>(
  value: string | undefined,
  allowedValues: readonly T[],
  fallback: T,
) {
  return value && allowedValues.includes(value as T) ? (value as T) : fallback;
}

function normalizeDynamicOption(
  value: string | undefined,
  allowedValues: readonly string[],
  fallback: string,
) {
  return value && allowedValues.includes(value) ? value : fallback;
}

export function getHeroRoleOptions(heroes: Hero[]) {
  return [...new Set(heroes.flatMap((hero) => hero.role))];
}

export function getHeroLaneOptions(heroes: Hero[]) {
  return [...new Set(heroes.flatMap((hero) => hero.lane))];
}

export function getNewsCategoryOptions(news: News[]) {
  return [...new Set(news.map((story) => story.category))];
}

export function parseHeroExplorerFilters(
  input: SearchParamInput,
  options: { roles: readonly string[]; lanes: readonly string[] },
) {
  return {
    query: normalizeQuery(readParam(input, "q")),
    role: normalizeDynamicOption(
      readParam(input, "role"),
      ["all", ...options.roles],
      defaultHeroExplorerFilters.role,
    ),
    lane: normalizeDynamicOption(
      readParam(input, "lane"),
      ["all", ...options.lanes],
      defaultHeroExplorerFilters.lane,
    ),
    layout: normalizeOption(
      readParam(input, "layout"),
      heroLayoutValues,
      defaultHeroExplorerFilters.layout,
    ),
    sort: normalizeOption(
      readParam(input, "sort"),
      heroSortValues,
      defaultHeroExplorerFilters.sort,
    ),
  } satisfies HeroExplorerFilters;
}

export function createHeroExplorerSearchParams(filters: HeroExplorerFilters) {
  const params = new URLSearchParams();

  if (filters.query) params.set("q", filters.query);
  if (filters.role !== defaultHeroExplorerFilters.role) params.set("role", filters.role);
  if (filters.lane !== defaultHeroExplorerFilters.lane) params.set("lane", filters.lane);
  if (filters.layout !== defaultHeroExplorerFilters.layout) {
    params.set("layout", filters.layout);
  }
  if (filters.sort !== defaultHeroExplorerFilters.sort) params.set("sort", filters.sort);

  return params;
}

export function parseNewsExplorerFilters(
  input: SearchParamInput,
  options: { heroSlugs: readonly string[]; categories: readonly string[] },
) {
  const softParam = readParam(input, "soft");

  return {
    query: normalizeQuery(readParam(input, "q")),
    heroSlug: normalizeDynamicOption(
      readParam(input, "hero"),
      ["all", ...options.heroSlugs],
      defaultNewsExplorerFilters.heroSlug,
    ),
    category: normalizeDynamicOption(
      readParam(input, "category"),
      ["all", ...options.categories],
      defaultNewsExplorerFilters.category,
    ),
    softOnly: softParam === "1" || softParam === "true" || softParam === "on",
  } satisfies NewsExplorerFilters;
}

export function createNewsExplorerSearchParams(filters: NewsExplorerFilters) {
  const params = new URLSearchParams();

  if (filters.query) params.set("q", filters.query);
  if (filters.heroSlug !== defaultNewsExplorerFilters.heroSlug) {
    params.set("hero", filters.heroSlug);
  }
  if (filters.category !== defaultNewsExplorerFilters.category) {
    params.set("category", filters.category);
  }
  if (filters.softOnly) params.set("soft", "1");

  return params;
}

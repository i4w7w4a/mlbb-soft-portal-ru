"use client";

import type { Route } from "next";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { EmptyState } from "@/components/feedback/empty-state";
import { HeroCard } from "@/components/cards/hero-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Hero } from "@/lib/content/schemas";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  createHeroExplorerSearchParams,
  getHeroLaneOptions,
  getHeroRoleOptions,
  type HeroExplorerFilters,
  parseHeroExplorerFilters,
} from "@/lib/explorer-filters";

type HeroRole = Hero["role"][number];
type HeroLane = Hero["lane"][number];

export function HeroesExplorer({
  heroes,
  initialFilters,
}: {
  heroes: Hero[];
  initialFilters: HeroExplorerFilters;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialFilters.query);
  const [role, setRole] = useState(initialFilters.role);
  const [lane, setLane] = useState(initialFilters.lane);
  const [layout, setLayout] = useState<"grid" | "list">(initialFilters.layout);
  const [sort, setSort] = useState<"featured" | "alpha" | "release">(initialFilters.sort);

  const roles = useMemo(() => ["all", ...getHeroRoleOptions(heroes)], [heroes]);
  const lanes = useMemo(() => ["all", ...getHeroLaneOptions(heroes)], [heroes]);
  const debouncedQuery = useDebouncedValue(query, 220);
  const filtersFromUrl = useMemo(
    () =>
      parseHeroExplorerFilters(searchParams, {
        roles: roles.filter((option) => option !== "all"),
        lanes: lanes.filter((option) => option !== "all"),
      }),
    [lanes, roles, searchParams],
  );

  useEffect(() => {
    setQuery(filtersFromUrl.query);
    setRole(filtersFromUrl.role);
    setLane(filtersFromUrl.lane);
    setLayout(filtersFromUrl.layout);
    setSort(filtersFromUrl.sort);
  }, [filtersFromUrl]);

  useEffect(() => {
    const nextParams = createHeroExplorerSearchParams({
      query: debouncedQuery,
      role,
      lane,
      layout,
      sort,
    });
    const nextQuery = nextParams.toString();
    const currentQuery = searchParams.toString();

    if (nextQuery === currentQuery) {
      return;
    }

    const href = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    router.replace(href as Route, { scroll: false });
  }, [debouncedQuery, lane, layout, pathname, role, router, searchParams, sort]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return [...heroes]
      .filter((hero) => (role === "all" ? true : hero.role.includes(role as HeroRole)))
      .filter((hero) => (lane === "all" ? true : hero.lane.includes(lane as HeroLane)))
      .filter((hero) =>
        normalized
          ? `${hero.name} ${hero.title} ${hero.excerpt}`.toLowerCase().includes(normalized)
          : true,
      )
      .sort((left, right) => {
        if (sort === "alpha") return left.name.localeCompare(right.name);
        if (sort === "release") return right.releaseYear - left.releaseYear;
        return Number(right.isFeatured) - Number(left.isFeatured);
      });
  }, [heroes, lane, query, role, sort]);

  const activeFilters = useMemo(
    () =>
      [
        query.trim() ? `Query: ${query.trim()}` : null,
        role !== "all" ? `Role: ${role}` : null,
        lane !== "all" ? `Lane: ${lane}` : null,
        layout !== "grid" ? `View: ${layout}` : null,
        sort !== "featured"
          ? `Sort: ${sort === "alpha" ? "alphabetical" : "newest release"}`
          : null,
      ].filter(Boolean) as string[],
    [lane, layout, query, role, sort],
  );

  function resetFilters() {
    setQuery("");
    setRole("all");
    setLane("all");
    setSort("featured");
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 rounded-[32px] border border-white/10 bg-white/4 p-5 lg:grid-cols-[2fr_repeat(4,minmax(0,1fr))]">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search heroes"
          aria-label="Search heroes"
        />
        <select
          value={role}
          onChange={(event) => setRole(event.target.value)}
          className="h-12 rounded-2xl border border-white/12 bg-black/30 px-4 text-sm text-white outline-none"
        >
          {roles.map((option) => (
            <option key={option} value={option}>
              {option === "all" ? "All roles" : option}
            </option>
          ))}
        </select>
        <select
          value={lane}
          onChange={(event) => setLane(event.target.value)}
          className="h-12 rounded-2xl border border-white/12 bg-black/30 px-4 text-sm text-white outline-none"
        >
          {lanes.map((option) => (
            <option key={option} value={option}>
              {option === "all" ? "All lanes" : option}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(event) => setSort(event.target.value as typeof sort)}
          className="h-12 rounded-2xl border border-white/12 bg-black/30 px-4 text-sm text-white outline-none"
        >
          <option value="featured">Featured first</option>
          <option value="alpha">Alphabetical</option>
          <option value="release">Newest release</option>
        </select>
        <div className="flex gap-2">
          <Button
            variant={layout === "grid" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setLayout("grid")}
            className="flex-1"
          >
            Grid
          </Button>
          <Button
            variant={layout === "list" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setLayout("list")}
            className="flex-1"
          >
            List
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-400">
        <p>
          Showing <span className="text-white">{filtered.length}</span> of{" "}
          <span className="text-white">{heroes.length}</span> heroes.
        </p>
        {activeFilters.length ? (
          <div className="flex flex-wrap gap-2">
            {activeFilters.map((filter) => (
              <Badge key={filter}>{filter}</Badge>
            ))}
          </div>
        ) : null}
      </div>
      {filtered.length ? (
        <div
          className={
            layout === "grid"
              ? "grid gap-5 md:grid-cols-2 xl:grid-cols-3"
              : "grid gap-5"
          }
        >
          {filtered.map((hero) => (
            <HeroCard key={hero.slug} hero={hero} compact={layout === "list"} />
          ))}
        </div>
      ) : (
        <EmptyState
          eyebrow="Hero Explorer"
          title="No hero fits this slice."
          description="Widen the search or clear role and lane filters to bring the full roster back into view."
          meta={
            activeFilters.length
              ? activeFilters.map((filter) => <Badge key={filter}>{filter}</Badge>)
              : undefined
          }
          actions={
            <Button type="button" variant="secondary" onClick={resetFilters}>
              Reset filters
            </Button>
          }
        />
      )}
    </div>
  );
}

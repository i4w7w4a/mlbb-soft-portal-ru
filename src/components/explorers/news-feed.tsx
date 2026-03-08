"use client";

import { useMemo, useState } from "react";

import { NewsCard } from "@/components/cards/news-card";
import { EmptyState } from "@/components/feedback/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Hero, News } from "@/lib/content/schemas";

export function NewsFeed({
  news,
  heroes,
  defaultSoftOnly = false,
}: {
  news: News[];
  heroes: Hero[];
  defaultSoftOnly?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [heroSlug, setHeroSlug] = useState("all");
  const [softOnly, setSoftOnly] = useState(defaultSoftOnly);
  const [category, setCategory] = useState("all");

  const categories = useMemo(
    () => ["all", ...new Set(news.map((story) => story.category))],
    [news],
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return news.filter((story) => {
      if (heroSlug !== "all" && story.heroSlug !== heroSlug) return false;
      if (softOnly && !story.isSoft) return false;
      if (category !== "all" && story.category !== category) return false;
      if (
        normalized &&
        !`${story.title} ${story.excerpt} ${story.tags.join(" ")}`
          .toLowerCase()
          .includes(normalized)
      ) {
        return false;
      }

      return true;
    });
  }, [category, heroSlug, news, query, softOnly]);

  const activeFilters = useMemo(
    () =>
      [
        query.trim() ? `Query: ${query.trim()}` : null,
        heroSlug !== "all"
          ? `Hero: ${heroes.find((hero) => hero.slug === heroSlug)?.name ?? heroSlug}`
          : null,
        category !== "all" ? `Category: ${category.replace(/-/g, " ")}` : null,
        softOnly ? "SOFT only" : null,
      ].filter(Boolean) as string[],
    [category, heroSlug, heroes, query, softOnly],
  );

  function resetFilters() {
    setQuery("");
    setHeroSlug("all");
    setCategory("all");
    setSoftOnly(defaultSoftOnly);
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 rounded-[32px] border border-white/10 bg-white/4 p-5 lg:grid-cols-[2fr_repeat(3,minmax(0,1fr))]">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search news"
          aria-label="Search news"
        />
        <select
          value={heroSlug}
          onChange={(event) => setHeroSlug(event.target.value)}
          className="h-12 rounded-2xl border border-white/12 bg-black/30 px-4 text-sm text-white outline-none"
        >
          <option value="all">All heroes</option>
          {heroes.map((hero) => (
            <option key={hero.slug} value={hero.slug}>
              {hero.name}
            </option>
          ))}
        </select>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="h-12 rounded-2xl border border-white/12 bg-black/30 px-4 text-sm text-white outline-none"
        >
          {categories.map((option) => (
            <option key={option} value={option}>
              {option === "all" ? "All categories" : option}
            </option>
          ))}
        </select>
        <label className="flex h-12 items-center justify-between rounded-2xl border border-white/12 bg-black/30 px-4 text-sm text-slate-200">
          SOFT only
          <input
            type="checkbox"
            checked={softOnly}
            onChange={(event) => setSoftOnly(event.target.checked)}
            className="size-4 accent-cyan-300"
          />
        </label>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-400">
        <p>
          Showing <span className="text-white">{filtered.length}</span> of{" "}
          <span className="text-white">{news.length}</span> stories.
        </p>
        {activeFilters.length ? (
          <div className="flex flex-wrap gap-2">
            {activeFilters.map((filter) => (
              <Badge key={filter} variant={filter === "SOFT only" ? "soft" : "default"}>
                {filter}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>
      {filtered.length ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {filtered.map((story, index) => (
            <NewsCard
              key={story.slug}
              story={story}
              heroName={heroes.find((hero) => hero.slug === story.heroSlug)?.name}
              large={index === 0}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          eyebrow="News Feed"
          title="No story matches the active cut."
          description="Clear the current filters or disable the SOFT-only lens to reveal the wider editorial stream again."
          tone={softOnly ? "soft" : "default"}
          meta={
            activeFilters.length
              ? activeFilters.map((filter) => (
                  <Badge key={filter} variant={filter === "SOFT only" ? "soft" : "default"}>
                    {filter}
                  </Badge>
                ))
              : undefined
          }
          actions={
            <Button type="button" variant="secondary" onClick={resetFilters}>
              Reset feed filters
            </Button>
          }
        />
      )}
    </div>
  );
}

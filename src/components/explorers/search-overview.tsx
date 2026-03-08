"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Search, Sparkles } from "lucide-react";

import { HeroCard } from "@/components/cards/hero-card";
import { NewsCard } from "@/components/cards/news-card";
import { EmptyState } from "@/components/feedback/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { createSearchSuggestions } from "@/lib/search";
import type { Hero, News, TaxonomyTag } from "@/lib/content/schemas";

function SearchChip({ term }: { term: string }) {
  return (
    <Link
      href={`/search?q=${encodeURIComponent(term)}`}
      className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.22em] text-slate-300 transition-colors hover:border-cyan-300/24 hover:text-white"
    >
      {term}
    </Link>
  );
}

export function SearchOverview({
  query,
  heroes,
  news,
  tags,
  catalogHeroes,
  catalogTags,
}: {
  query: string;
  heroes: Hero[];
  news: News[];
  tags: TaxonomyTag[];
  catalogHeroes: Hero[];
  catalogTags: TaxonomyTag[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [queryValue, setQueryValue] = useState(query);
  const debouncedQuery = useDebouncedValue(queryValue, 220);
  const normalizedQuery = query.trim();
  const total = heroes.length + news.length + tags.length;
  const suggestions = useMemo(
    () => createSearchSuggestions({ heroes: catalogHeroes, tags: catalogTags }),
    [catalogHeroes, catalogTags],
  );
  const heroNameBySlug = useMemo(
    () => new Map(catalogHeroes.map((hero) => [hero.slug, hero.name])),
    [catalogHeroes],
  );
  const leadStory = news[0] ?? null;
  const leadHero = heroes[0] ?? null;
  const leadTag = tags[0] ?? null;
  const supportingStories = leadStory ? news.slice(1, 5) : news.slice(0, 4);
  const supportingHeroes = leadHero ? heroes.slice(1, 5) : heroes.slice(0, 4);

  useEffect(() => {
    setQueryValue(query);
  }, [query]);

  useEffect(() => {
    const nextQuery = debouncedQuery.trim();
    const params = new URLSearchParams(searchParams.toString());

    if (nextQuery) {
      params.set("q", nextQuery);
    } else {
      params.delete("q");
    }

    const nextParams = params.toString();
    const currentParams = searchParams.toString();

    if (nextParams === currentParams) {
      return;
    }

    const href = nextParams ? `${pathname}?${nextParams}` : pathname;
    router.replace(href as Route, { scroll: false });
  }, [debouncedQuery, pathname, router, searchParams]);

  if (!normalizedQuery && !total) {
    return (
      <EmptyState
        eyebrow="Search Console"
        title="Start with a hero, lane, or SOFT signal."
        description="The portal search is tuned for hero universes, editorial threads, and taxonomy signals. Use a short exact phrase and let the groups guide you deeper."
        tone="soft"
        actions={
          <div className="flex flex-wrap justify-center gap-2">
            {suggestions.map((term) => (
              <SearchChip key={term} term={term} />
            ))}
          </div>
        }
      />
    );
  }

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(101,230,255,0.12),transparent_32%),linear-gradient(180deg,rgba(10,17,30,0.94),rgba(5,9,18,0.97))]">
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={normalizedQuery ? "soft" : "default"}>
                {normalizedQuery ? "Query live" : "Curated entry"}
              </Badge>
              <Badge>{total} matches in view</Badge>
            </div>
            <div className="space-y-3">
              <p className="font-display text-[clamp(2rem,3.4vw,3.6rem)] leading-none text-white">
                Search the portal with editorial context intact.
              </p>
              <p className="max-w-3xl text-sm leading-7 text-slate-300">
                Results stay grouped by hero universes, stories, and taxonomy signals so discovery still feels intentional instead of collapsing into a flat list.
              </p>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
              <Input
                value={queryValue}
                onChange={(event) => setQueryValue(event.target.value)}
                placeholder="Search heroes, stories, tags, lanes, SOFT..."
                aria-label="Search the portal"
                className="pl-11"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {suggestions.map((term) => (
                <SearchChip key={term} term={term} />
              ))}
              {normalizedQuery ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setQueryValue("")}
                >
                  Clear query
                </Button>
              ) : null}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <Card className="space-y-2 border-white/8 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Heroes</p>
              <p className="font-display text-4xl text-white">{heroes.length}</p>
              <p className="text-sm leading-6 text-slate-400">
                Character universes, archetypes, and identity matches.
              </p>
            </Card>
            <Card className="space-y-2 border-white/8 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Stories</p>
              <p className="font-display text-4xl text-white">{news.length}</p>
              <p className="text-sm leading-6 text-slate-400">
                Editorial threads, patch reads, and SOFT features.
              </p>
            </Card>
            <Card className="space-y-2 border-white/8 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Signals</p>
              <p className="font-display text-4xl text-white">{tags.length}</p>
              <p className="text-sm leading-6 text-slate-400">
                Taxonomy matches that can redirect the whole search slice.
              </p>
            </Card>
          </div>
        </div>
      </Card>

      {normalizedQuery && !total ? (
        <EmptyState
          eyebrow="Search Results"
          title="No linked entities came back."
          description="Try a broader phrase, a hero name, or one of the SOFT/meta keywords used across the portal taxonomy."
          tone="soft"
          meta={suggestions.map((term) => (
            <SearchChip key={term} term={term} />
          ))}
        />
      ) : null}

      {total ? (
        <>
          {leadStory || leadHero || leadTag ? (
            <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <div>
                {leadStory ? (
                  <NewsCard
                    story={leadStory}
                    heroName={heroNameBySlug.get(leadStory.heroSlug)}
                    large
                  />
                ) : leadHero ? (
                  <HeroCard hero={leadHero} />
                ) : null}
              </div>
              <Card className="space-y-5">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-cyan-100">
                    <Sparkles className="size-3.5" />
                    Search lead
                  </div>
                  {leadHero ? (
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                        Hero universe
                      </p>
                      <Link
                        href={`/heroes/${leadHero.slug}`}
                        className="inline-flex items-center gap-2 text-2xl font-medium text-white transition-colors hover:text-cyan-100"
                      >
                        {leadHero.name}
                        <ArrowUpRight className="size-4" />
                      </Link>
                      <p className="text-sm leading-6 text-slate-400">{leadHero.excerpt}</p>
                    </div>
                  ) : null}
                  {leadTag ? (
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                        Signal match
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <SearchChip term={leadTag.label} />
                        <Badge>{leadTag.kind}</Badge>
                      </div>
                    </div>
                  ) : null}
                </div>
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                    Refine with signals
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {tags.slice(0, 6).map((tag) => (
                      <SearchChip key={tag.slug} term={tag.label} />
                    ))}
                    {!tags.length ? (
                      <p className="text-sm leading-6 text-slate-400">
                        No taxonomy hit yet. Try a broader editorial term like SOFT, patch, or meta.
                      </p>
                    ) : null}
                  </div>
                </div>
              </Card>
            </div>
          ) : null}

          <div className="grid gap-8">
            <section className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                    Editorial Threads
                  </p>
                  <p className="mt-2 font-display text-3xl text-white">
                    Stories stay grouped by narrative weight.
                  </p>
                </div>
                <Badge variant="highlight">{news.length} story matches</Badge>
              </div>
              {supportingStories.length ? (
                <div className="grid gap-5 lg:grid-cols-2">
                  {supportingStories.map((story) => (
                    <NewsCard
                      key={story.slug}
                      story={story}
                      heroName={heroNameBySlug.get(story.heroSlug)}
                    />
                  ))}
                </div>
              ) : (
                <Card className="border-white/8 bg-black/20 text-sm leading-6 text-slate-400">
                  No supporting stories beyond the lead result yet.
                </Card>
              )}
            </section>

            <section className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                    Hero Universes
                  </p>
                  <p className="mt-2 font-display text-3xl text-white">
                    Character matches keep their own gravity.
                  </p>
                </div>
                <Badge>{heroes.length} hero matches</Badge>
              </div>
              {supportingHeroes.length ? (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                  {supportingHeroes.map((hero) => (
                    <HeroCard key={hero.slug} hero={hero} />
                  ))}
                </div>
              ) : (
                <Card className="border-white/8 bg-black/20 text-sm leading-6 text-slate-400">
                  No additional hero universes sit behind the current lead match.
                </Card>
              )}
            </section>

            <section className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                    Taxonomy Signals
                  </p>
                  <p className="mt-2 font-display text-3xl text-white">
                    Redirect the search slice with the portal’s own language.
                  </p>
                </div>
                <Badge variant="soft">{tags.length} signal matches</Badge>
              </div>
              <Card className="space-y-5 border-white/8 bg-black/20">
                {tags.length ? (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <SearchChip key={tag.slug} term={tag.label} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm leading-6 text-slate-400">
                    No taxonomy terms matched directly. Try SOFT, patch, guide, meta, or a lane keyword to widen the slice.
                  </p>
                )}
              </Card>
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
}

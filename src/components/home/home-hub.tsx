"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState, useTransition } from "react";
import { ArrowRight, Layers3, Sparkles } from "lucide-react";

import { HeroCard } from "@/components/cards/hero-card";
import { NewsCard } from "@/components/cards/news-card";
import { SectionHeading } from "@/components/layout/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Hero, News } from "@/lib/content/schemas";
import { cn, titleCase, unique } from "@/lib/utils";

type PortalCollection = {
  slug: string;
  title: string;
  excerpt: string;
  items: News[];
};

type PortalSnapshot = {
  softConfig: {
    headline: string;
    description: string;
    manifesto: string[];
  };
  featuredHeroes: Hero[];
  featuredNews: News[];
  trending: News[];
  spotlight: News[];
  collections: PortalCollection[];
};

type FilterScope = "all" | "soft" | "role" | "lane" | "category";

type HomeFilter = {
  id: string;
  label: string;
  description: string;
  scope: FilterScope;
  value?: string;
};

const storyGridSpans = [
  "md:col-span-2 xl:col-span-7",
  "xl:col-span-5",
  "xl:col-span-4",
  "xl:col-span-4",
  "xl:col-span-4",
];

function buildHomeFilters(heroes: Hero[], stories: News[]) {
  const categories = unique(stories.map((story) => story.category))
    .filter((category) =>
      ["patch-analysis", "hero-guide", "meta-watch", "editorial"].includes(category),
    )
    .slice(0, 3)
    .map<HomeFilter>((category) => ({
      id: `category:${category}`,
      label: titleCase(category),
      description: `Prioritize ${category.replace(/-/g, " ")} reads on the front page.`,
      scope: "category",
      value: category,
    }));
  const roles = unique(heroes.flatMap((hero) => hero.role))
    .slice(0, 2)
    .map<HomeFilter>((role) => ({
      id: `role:${role}`,
      label: role,
      description: `Surface hero universes and reads centered on ${role.toLowerCase()} play.`,
      scope: "role",
      value: role,
    }));
  const lanes = unique(heroes.flatMap((hero) => hero.lane))
    .filter((lane) => lane === "Jungle" || lane === "Mid")
    .slice(0, 1)
    .map<HomeFilter>((lane) => ({
      id: `lane:${lane}`,
      label: lane,
      description: `Shift the homepage toward ${lane.toLowerCase()} pressure and routing stories.`,
      scope: "lane",
      value: lane,
    }));

  return [
    {
      id: "all",
      label: "All Signals",
      description: "Read the homepage in its default editorial balance.",
      scope: "all",
    },
    {
      id: "soft",
      label: "SOFT",
      description: "Bias the front page toward premium reads and SOFT-marked hero universes.",
      scope: "soft",
    },
    ...roles,
    ...lanes,
    ...categories,
  ] satisfies HomeFilter[];
}

function storyMatchesFilter(story: News, filter: HomeFilter, heroMap: Map<string, Hero>) {
  if (filter.scope === "all") {
    return true;
  }

  if (filter.scope === "soft") {
    return story.isSoft;
  }

  if (filter.scope === "category") {
    return story.category === filter.value;
  }

  const hero = heroMap.get(story.heroSlug);

  if (!hero) {
    return false;
  }

  if (filter.scope === "role") {
    return hero.role.includes(filter.value as Hero["role"][number]);
  }

  if (filter.scope === "lane") {
    return hero.lane.includes(filter.value as Hero["lane"][number]);
  }

  return true;
}

function heroMatchesFilter(hero: Hero, filter: HomeFilter, stories: News[]) {
  if (filter.scope === "all") {
    return true;
  }

  if (filter.scope === "soft") {
    return hero.isSoftFeatured || stories.some((story) => story.heroSlug === hero.slug && story.isSoft);
  }

  if (filter.scope === "role") {
    return hero.role.includes(filter.value as Hero["role"][number]);
  }

  if (filter.scope === "lane") {
    return hero.lane.includes(filter.value as Hero["lane"][number]);
  }

  return stories.some(
    (story) => story.heroSlug === hero.slug && story.category === filter.value,
  );
}

export function HomeHub({
  snapshot,
  heroes,
  latestNews,
}: {
  snapshot: PortalSnapshot;
  heroes: Hero[];
  latestNews: News[];
}) {
  const [selectedFilterId, setSelectedFilterId] = useState("all");
  const [isPending, startTransition] = useTransition();
  const deferredFilterId = useDeferredValue(selectedFilterId);

  const heroMap = useMemo(
    () => new Map(heroes.map((hero) => [hero.slug, hero])),
    [heroes],
  );
  const filterOptions = useMemo(() => buildHomeFilters(heroes, latestNews), [heroes, latestNews]);
  const activeFilter =
    filterOptions.find((filter) => filter.id === deferredFilterId) ?? filterOptions[0];
  const isSoftLens = activeFilter.id === "soft";

  const filterCounts = useMemo(
    () =>
      Object.fromEntries(
        filterOptions.map((filter) => [
          filter.id,
          latestNews.filter((story) => storyMatchesFilter(story, filter, heroMap)).length,
        ]),
      ),
    [filterOptions, heroMap, latestNews],
  );

  const filteredStories = useMemo(
    () =>
      latestNews.filter((story) => storyMatchesFilter(story, activeFilter, heroMap)),
    [activeFilter, heroMap, latestNews],
  );
  const filteredHeroes = useMemo(
    () => heroes.filter((hero) => heroMatchesFilter(hero, activeFilter, latestNews)),
    [activeFilter, heroes, latestNews],
  );
  const primaryStory = filteredStories[0] ?? latestNews[0];
  const featuredStories = filteredStories.slice(0, 5);
  const heroShowcase = filteredHeroes.slice(0, 4);
  const activeTrending =
    snapshot.trending.filter((story) => storyMatchesFilter(story, activeFilter, heroMap)) ||
    [];
  const collectionShowcase =
    snapshot.collections
      .map((collection) => ({
        ...collection,
        items: collection.items.filter((story) => storyMatchesFilter(story, activeFilter, heroMap)),
      }))
      .filter((collection) => collection.items.length > 0) || [];
  const leadCollection = collectionShowcase[0] ?? snapshot.collections[0];
  const supportCollection = collectionShowcase[1] ?? snapshot.collections[1] ?? null;
  const softPriority = unique(
    snapshot.spotlight
      .concat(snapshot.featuredNews)
      .filter((story) => storyMatchesFilter(story, activeFilter, heroMap)),
  ).slice(0, 3);

  return (
    <div className="mx-auto flex w-[min(100%-1.5rem,88rem)] flex-col gap-16">
      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
        <Card
          className={cn(
            "soft-home-hero relative overflow-hidden p-8 md:p-10",
            isSoftLens && "soft-lens-active",
          )}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(101,230,255,0.24),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(244,132,255,0.16),transparent_24%),linear-gradient(180deg,rgba(6,9,20,0),rgba(6,9,20,0.35))]" />
          <div className="relative space-y-8">
            <Badge variant="soft" className="w-fit">Editorial Hub</Badge>
            <div className="space-y-5">
              <h1 className="max-w-4xl font-display text-5xl leading-none tracking-tight text-white md:text-7xl">
                SOFT stays central while the homepage adapts to the signal you need.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-300">
                The front page now behaves like a discovery console: switch the editorial lens, tighten the feed, and move from hero universes to premium reads without losing atmosphere.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Heroes</p>
                <p className="mt-3 font-display text-3xl text-white">{heroes.length}</p>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Stories</p>
                <p className="mt-3 font-display text-3xl text-white">{latestNews.length}</p>
              </div>
              <div className="rounded-[28px] border border-cyan-300/20 bg-cyan-300/10 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/70">Current lens</p>
                <p className="mt-3 font-display text-3xl text-cyan-50">{activeFilter.label}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/soft"><Button size="lg">Enter SOFT</Button></Link>
              <Link href="/heroes"><Button variant="secondary" size="lg">Browse heroes</Button></Link>
            </div>
          </div>
        </Card>
        <div className="grid gap-6">
          <Card className="flex flex-col justify-between gap-8 border-cyan-300/15 bg-[radial-gradient(circle_at_top,rgba(101,230,255,0.22),transparent_35%),linear-gradient(180deg,rgba(12,18,31,0.95),rgba(3,8,16,0.95))]">
            <div className="space-y-4">
              <Badge variant="soft" className="w-fit">SOFT Core</Badge>
              <h2 className="font-display text-4xl text-white">{snapshot.softConfig.headline}</h2>
              <p className="text-base leading-7 text-slate-300">{snapshot.softConfig.description}</p>
            </div>
            <div className="space-y-4">
              {snapshot.softConfig.manifesto.map((item) => (
                <div key={item} className="rounded-[24px] border border-white/8 bg-white/6 px-4 py-4 text-sm leading-6 text-slate-200">
                  {item}
                </div>
              ))}
            </div>
          </Card>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="space-y-3 border-white/8 bg-black/20">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Trending rail</p>
              <p className="font-display text-3xl text-white">{snapshot.trending.length}</p>
              <p className="text-sm leading-6 text-slate-400">Curated stories already pushing the meta conversation.</p>
            </Card>
            <Card className="space-y-3 border-white/8 bg-black/20">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Collections live</p>
              <p className="font-display text-3xl text-white">{snapshot.collections.length}</p>
              <p className="text-sm leading-6 text-slate-400">Expandable editorial zones with stronger front-page rhythm.</p>
            </Card>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeading
          eyebrow="Fast Filters"
          title="Switch the homepage lens before you drop into the feed."
          description="These chips rebalance hero universes, latest reads, and editorial collections around a sharper signal."
        />
        <Card
          className={cn(
            "soft-home-filters relative overflow-hidden p-6 md:p-7",
            isSoftLens && "soft-lens-active",
          )}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(101,230,255,0.14),transparent_32%),radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.08),transparent_24%)]" />
          <div className="relative grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-5">
              <div className="flex flex-wrap gap-3">
                {filterOptions.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => startTransition(() => setSelectedFilterId(filter.id))}
                    aria-pressed={selectedFilterId === filter.id}
                    className={cn(
                      "inline-flex min-h-11 items-center gap-3 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                      selectedFilterId === filter.id
                        ? "border-cyan-300/30 bg-cyan-300/12 text-cyan-100"
                        : "border-white/10 bg-white/4 text-slate-300 hover:border-white/18 hover:text-white",
                    )}
                  >
                    <span>{filter.label}</span>
                    <span className="rounded-full border border-current/15 px-2 py-0.5 text-[11px] uppercase tracking-[0.24em]">
                      {filterCounts[filter.id] ?? 0}
                    </span>
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Current filter</p>
                <p className="font-display text-4xl text-white">{activeFilter.label}</p>
                <p className="max-w-2xl text-sm leading-6 text-slate-300">{activeFilter.description}</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
              <Card className="border-white/8 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Stories in view</p>
                <p className="mt-2 font-display text-3xl text-white">{filteredStories.length}</p>
              </Card>
              <Card className="border-white/8 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Hero universes</p>
                <p className="mt-2 font-display text-3xl text-white">{filteredHeroes.length}</p>
              </Card>
              <Card className="border-white/8 bg-black/20 p-5">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-500">
                  <Layers3 className="size-4" />
                  Bento rhythm
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Latest reads, hero cards, and collections now respond as one editorial system.
                </p>
                {isPending ? <p className="mt-3 text-xs uppercase tracking-[0.24em] text-cyan-100">Calibrating feed</p> : null}
              </Card>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card
          className={cn(
            "soft-home-lead relative overflow-hidden p-7 md:p-8",
            (isSoftLens || primaryStory?.isSoft) && "soft-lens-active",
          )}
        >
          <div className="absolute inset-0 opacity-90" style={{ background: primaryStory?.isSoft ? "radial-gradient(circle at top right, rgba(101,230,255,0.18), transparent 38%)" : "radial-gradient(circle at top right, rgba(255,255,255,0.08), transparent 28%)" }} />
          <div className="relative space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={primaryStory?.isSoft ? "soft" : "highlight"}>{activeFilter.label}</Badge>
              {primaryStory ? <Badge>{primaryStory.category.replace(/-/g, " ")}</Badge> : null}
            </div>
            {primaryStory ? (
              <>
                <div className="space-y-4">
                  <h2 className="max-w-4xl font-display text-4xl text-white md:text-5xl">{primaryStory.title}</h2>
                  <p className="max-w-3xl text-base leading-7 text-slate-300">{primaryStory.excerpt}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.24em] text-slate-500">
                  <span>{heroMap.get(primaryStory.heroSlug)?.name ?? primaryStory.heroSlug}</span>
                  <span>{new Date(primaryStory.publishedAt).toLocaleDateString("en-US")}</span>
                  <span>{primaryStory.readingTime} min</span>
                </div>
                <Link href={`/news/${primaryStory.slug}`} className="inline-flex items-center gap-2 text-sm font-medium text-slate-100 transition-colors hover:text-white">
                  Read the lead story
                  <ArrowRight className="size-4" />
                </Link>
              </>
            ) : null}
          </div>
        </Card>
        <div className="grid gap-6">
          <Card className="space-y-4 border-white/8 bg-[radial-gradient(circle_at_top_right,rgba(101,230,255,0.1),transparent_30%),linear-gradient(180deg,rgba(10,17,30,0.9),rgba(5,9,18,0.94))]">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-500">
              <Sparkles className="size-4" />
              Hero universes in view
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {heroShowcase.slice(0, 2).map((hero) => (
                <HeroCard key={hero.slug} hero={hero} compact />
              ))}
            </div>
          </Card>
          <Card className="space-y-4 border-white/8 bg-black/20">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Trending cut</p>
            <div className="space-y-3">
              {(activeTrending.length ? activeTrending : snapshot.trending).slice(0, 3).map((story) => (
                <Link key={story.slug} href={`/news/${story.slug}`} className="flex items-center justify-between rounded-[24px] border border-white/8 bg-white/4 px-4 py-4 transition-colors hover:border-cyan-300/20 hover:bg-white/6">
                  <div className="space-y-1">
                    <p className="font-display text-xl text-white">{story.title}</p>
                    <p className="text-sm text-slate-400">{story.excerpt}</p>
                  </div>
                  <ArrowRight className="size-4 text-slate-400" />
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeading
          eyebrow="Filtered Reads"
          title="Editorial cards now land in a sharper, more deliberate rhythm."
          description="The first module scales up, the rest support it, and the active filter keeps the section from collapsing into a generic list."
          href="/news"
        />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-12">
          {featuredStories.map((story, index) => (
            <div key={story.slug} className={storyGridSpans[index] ?? "xl:col-span-4"}>
              <NewsCard
                story={story}
                heroName={heroMap.get(story.heroSlug)?.name}
                large={index < 2}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeading
          eyebrow="Hero Universes"
          title="Hero cards keep their own gravity even inside the filtered front page."
          description="The homepage still reads like a portal of character-specific worlds, not just a feed."
          href="/heroes"
        />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-12">
          {heroShowcase.map((hero, index) => (
            <div key={hero.slug} className={index === 0 ? "xl:col-span-5" : index === 1 ? "xl:col-span-7" : "xl:col-span-6"}>
              <HeroCard hero={hero} compact={index > 1} />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeading
          eyebrow="Editorial Collections"
          title="Collections now anchor the page as deliberate bento zones."
          description="Instead of equal cards in a row, each collection gets a stronger role: one leads, one supports, and SOFT retains premium prominence."
        />
        <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="space-y-6">
            <div className="space-y-3">
              <Badge>{leadCollection.slug.replace(/-/g, " ")}</Badge>
              <div className="space-y-2">
                <h3 className="font-display text-4xl text-white">{leadCollection.title}</h3>
                <p className="max-w-3xl text-sm leading-6 text-slate-300">{leadCollection.excerpt}</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
              {leadCollection.items[0] ? (
                <Link href={`/news/${leadCollection.items[0].slug}`} className="rounded-[28px] border border-white/10 bg-white/4 p-5 transition-colors hover:border-cyan-300/20 hover:bg-white/6">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Lead read</p>
                  <p className="mt-3 font-display text-3xl text-white">{leadCollection.items[0].title}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{leadCollection.items[0].excerpt}</p>
                </Link>
              ) : null}
              <div className="space-y-3">
                {leadCollection.items.slice(1).map((story) => (
                  <Link key={story.slug} href={`/news/${story.slug}`} className="block rounded-[24px] border border-white/8 bg-black/20 px-4 py-4 text-slate-200 transition-colors hover:border-white/16 hover:text-white">
                    {story.title}
                  </Link>
                ))}
              </div>
            </div>
          </Card>
          <div className="grid gap-5">
            <Card
              className={cn(
                "soft-home-priority space-y-4 border-cyan-300/15 bg-[radial-gradient(circle_at_top_right,rgba(101,230,255,0.18),transparent_35%),linear-gradient(180deg,rgba(10,17,30,0.95),rgba(5,9,18,0.96))]",
                isSoftLens && "soft-lens-active",
              )}
            >
              <Badge variant="soft" className="w-fit">SOFT Priority</Badge>
              <p className="font-display text-3xl text-white">Premium reads stay elevated under every lens.</p>
              <div className="space-y-3">
                {(softPriority.length ? softPriority : snapshot.spotlight).slice(0, 3).map((story) => (
                  <Link key={story.slug} href={`/news/${story.slug}`} className="block rounded-[24px] border border-cyan-300/15 bg-cyan-300/10 px-4 py-4 text-cyan-50 transition-colors hover:bg-cyan-300/14">
                    {story.title}
                  </Link>
                ))}
              </div>
            </Card>
            {supportCollection ? (
              <Card className="space-y-4 border-white/8 bg-black/20">
                <Badge className="w-fit">{supportCollection.slug.replace(/-/g, " ")}</Badge>
                <div className="space-y-2">
                  <h3 className="font-display text-3xl text-white">{supportCollection.title}</h3>
                  <p className="text-sm leading-6 text-slate-300">{supportCollection.excerpt}</p>
                </div>
                <div className="space-y-3">
                  {supportCollection.items.map((story) => (
                    <Link key={story.slug} href={`/news/${story.slug}`} className="block rounded-[24px] border border-white/8 bg-white/4 px-4 py-4 text-slate-200 transition-colors hover:border-white/16 hover:text-white">
                      {story.title}
                    </Link>
                  ))}
                </div>
              </Card>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}

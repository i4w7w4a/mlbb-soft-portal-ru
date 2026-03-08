import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { HeroCard } from "@/components/cards/hero-card";
import { NewsCard } from "@/components/cards/news-card";
import { SectionHeading } from "@/components/layout/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getAllNews, getPortalSnapshot } from "@/lib/content/repository";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Home",
  description:
    "Spectacular MLBB editorial homepage with SOFT as the central content switch.",
});

export default async function HomePage() {
  const snapshot = await getPortalSnapshot();
  const latestNews = await getAllNews();

  return (
    <div className="mx-auto flex w-[min(100%-1.5rem,88rem)] flex-col gap-16">
      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
        <Card className="relative overflow-hidden p-8 md:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(101,230,255,0.24),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(244,132,255,0.22),transparent_24%)]" />
          <div className="relative space-y-8">
            <Badge variant="soft" className="w-fit">
              Editorial Hub
            </Badge>
            <div className="space-y-5">
              <h1 className="max-w-4xl font-display text-5xl leading-none tracking-tight text-white md:text-7xl">
                SOFT is the center of gravity for a premium MLBB hero portal.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-300">
                Every hero becomes a content universe. Every story lands with strong hierarchy, cinematic depth and expandable editorial structure.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Heroes</p>
                <p className="mt-3 font-display text-3xl text-white">6</p>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Published</p>
                <p className="mt-3 font-display text-3xl text-white">{latestNews.length}</p>
              </div>
              <div className="rounded-[28px] border border-cyan-300/20 bg-cyan-300/10 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/70">SOFT Layer</p>
                <p className="mt-3 font-display text-3xl text-cyan-50">Priority</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/soft">
                <Button size="lg">Enter SOFT</Button>
              </Link>
              <Link href="/heroes">
                <Button variant="secondary" size="lg">
                  Browse heroes
                </Button>
              </Link>
            </div>
          </div>
        </Card>
        <Card className="flex flex-col justify-between gap-8 border-cyan-300/15 bg-[radial-gradient(circle_at_top,rgba(101,230,255,0.22),transparent_35%),linear-gradient(180deg,rgba(12,18,31,0.95),rgba(3,8,16,0.95))]">
          <div className="space-y-4">
            <Badge variant="soft" className="w-fit">
              SOFT Core
            </Badge>
            <h2 className="font-display text-4xl text-white">
              {snapshot.softConfig.headline}
            </h2>
            <p className="text-base leading-7 text-slate-300">
              {snapshot.softConfig.description}
            </p>
          </div>
          <div className="space-y-4">
            {snapshot.softConfig.manifesto.map((item) => (
              <div
                key={item}
                className="rounded-[24px] border border-white/8 bg-white/6 px-4 py-4 text-sm leading-6 text-slate-200"
              >
                {item}
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="space-y-6">
        <SectionHeading
          eyebrow="Featured Heroes"
          title="Hero universes with individual editorial gravity."
          description="Every hero is framed as a living content destination with its own visual identity, related stories and SOFT relevance."
          href="/heroes"
        />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {snapshot.featuredHeroes.slice(0, 4).map((hero) => (
            <HeroCard key={hero.slug} hero={hero} />
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <SectionHeading
            eyebrow="Latest News"
            title="Fresh reads across patch analysis, guides and hero-specific meta shifts."
            description="Editorial cards keep density high without collapsing into a generic blog feed."
            href="/news"
          />
          <div className="grid gap-5 lg:grid-cols-2">
            {latestNews.slice(0, 4).map((story, index) => (
              <NewsCard
                key={story.slug}
                story={story}
                heroName={snapshot.featuredHeroes.find((hero) => hero.slug === story.heroSlug)?.name}
                large={index === 0}
              />
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <SectionHeading
            eyebrow="Today In Meta"
            title="Quick spotlight"
            description="A compact module for draft-sensitive stories."
          />
          <div className="space-y-4">
            {snapshot.trending.map((story) => (
              <Link
                key={story.slug}
                href={`/news/${story.slug}`}
                className="flex items-center justify-between rounded-[28px] border border-white/8 bg-white/5 px-5 py-5 transition-colors hover:border-cyan-300/20 hover:bg-white/7"
              >
                <div>
                  <p className="font-display text-xl text-white">{story.title}</p>
                  <p className="mt-2 text-sm text-slate-400">{story.excerpt}</p>
                </div>
                <ArrowRight className="size-4 text-slate-400" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeading
          eyebrow="SOFT Featured"
          title="Premium reads with stronger aura, stronger priority and stronger editorial weight."
          description="SOFT cards get their own visual tier and discovery bias."
          href="/soft"
          soft
        />
        <div className="grid gap-5 xl:grid-cols-3">
          {snapshot.spotlight.concat(snapshot.featuredNews.slice(0, 2)).slice(0, 3).map((story) => (
            <NewsCard key={story.slug} story={story} large />
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeading
          eyebrow="Editorial Collections"
          title="Bento-like content zones tuned for expansion."
          description="Collections keep the front page dramatic while staying scalable as the content model grows."
        />
        <div className="grid gap-5 xl:grid-cols-2">
          {snapshot.collections.map((collection) => (
            <Card key={collection.slug} className="space-y-5">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                  {collection.slug.replace(/-/g, " ")}
                </p>
                <h3 className="font-display text-3xl text-white">{collection.title}</h3>
                <p className="text-sm leading-6 text-slate-300">{collection.excerpt}</p>
              </div>
              <div className="space-y-3">
                {collection.items.map((story) => (
                  <Link key={story.slug} href={`/news/${story.slug}`} className="block text-slate-200 hover:text-white">
                    {story.title}
                  </Link>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}


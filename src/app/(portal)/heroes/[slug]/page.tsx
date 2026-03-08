import { notFound } from "next/navigation";

import { HeroCard } from "@/components/cards/hero-card";
import { HeroEmblem } from "@/components/media/hero-emblem";
import { NewsCard } from "@/components/cards/news-card";
import { SectionHeading } from "@/components/layout/section-heading";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  getAllHeroes,
  getHeroBySlug,
  getHeroNews,
  getRelatedHeroes,
} from "@/lib/content/repository";
import { createHeroMetadata, createMetadata } from "@/lib/seo";

export async function generateStaticParams() {
  const heroes = await getAllHeroes();
  return heroes.map((hero) => ({ slug: hero.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const hero = await getHeroBySlug(slug);

  if (!hero) {
    return createMetadata({
      title: "Hero",
      description: "Hero page",
    });
  }

  return createHeroMetadata(hero);
}

export default async function HeroPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const hero = await getHeroBySlug(slug);

  if (!hero) {
    notFound();
  }

  const [stories, relatedHeroes] = await Promise.all([
    getHeroNews(hero.slug, true),
    getRelatedHeroes(hero),
  ]);

  const softStories = stories.filter((story) => story.isSoft);

  return (
    <div className="mx-auto flex w-[min(100%-1.5rem,88rem)] flex-col gap-10">
      <Card
        className={`soft-hero-surface relative overflow-hidden p-8 md:p-10 ${hero.isSoftFeatured ? "soft-accent-surface" : ""}`}
      >
        <div
          className="absolute inset-0 bg-cover bg-center opacity-44"
          style={{
            backgroundImage: `url(${hero.cover})`,
          }}
        />
        <div
          className="absolute inset-0 opacity-85"
          style={{
            background: `radial-gradient(circle at top right, ${hero.accent}42, transparent 24%), linear-gradient(180deg, rgba(5,9,18,0.14), rgba(5,9,18,0.94))`,
          }}
        />
        <div className="relative grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5">
            <div className="flex flex-wrap gap-3">
              {hero.role.map((role) => (
                <Badge key={role}>{role}</Badge>
              ))}
              {hero.isSoftFeatured ? <Badge variant="soft">SOFT hero</Badge> : null}
            </div>
            <div className="space-y-3">
              <h1 className="font-display text-5xl tracking-tight text-white md:text-7xl">
                {hero.name}
              </h1>
              <p className="text-sm uppercase tracking-[0.28em] text-slate-500">
                {hero.title}
              </p>
              <p className="max-w-2xl text-lg leading-8 text-slate-200">{hero.excerpt}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Lane</p>
                <p className="mt-2 text-sm text-white">{hero.lane.join(" / ")}</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Specialty</p>
                <p className="mt-2 text-sm text-white">{hero.specialty.join(" / ")}</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Difficulty</p>
                <p className="mt-2 text-sm text-white">{hero.difficulty}</p>
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-black/24 p-6">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-70"
              style={{
                backgroundImage: `url(${hero.cover})`,
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(180deg, rgba(5,9,18,0.18), rgba(5,9,18,0.92)), radial-gradient(circle at 84% 18%, ${hero.accent}34, transparent 26%)`,
              }}
            />
            <div className="relative flex h-full flex-col justify-between gap-8">
              <div className="flex items-start justify-between gap-5">
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Profile</p>
                  <p className="max-w-sm text-sm leading-7 text-slate-200">{hero.signature}</p>
                </div>
                <HeroEmblem hero={hero} size="lg" />
              </div>
              <div className="grid gap-3 text-sm text-slate-300">
                <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                  <span>Faction</span>
                  <span>{hero.faction}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                  <span>Release year</span>
                  <span>{hero.releaseYear}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                  <span>Story count</span>
                  <span>{stories.length}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                  <span>SOFT presence</span>
                  <span>{softStories.length ? `${softStories.length} stories` : "Standby"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <section className="space-y-6">
        <SectionHeading
          eyebrow="Hero Coverage"
          title={`Latest ${hero.name} stories`}
          description="News, guides and patch-sensitive analysis tied directly to this hero."
        />
        <div className="grid gap-5 lg:grid-cols-2">
          {stories.map((story, index) => (
            <NewsCard key={story.slug} story={story} heroName={hero.name} large={index === 0} />
          ))}
        </div>
      </section>

      {softStories.length ? (
        <section className="soft-hero-rail space-y-6">
          <SectionHeading
            eyebrow="SOFT Rail"
            title={`${hero.name} inside SOFT`}
            description="SOFT stories receive stronger presentation and remain close to the hero context."
            soft
          />
          <div className="grid gap-5 lg:grid-cols-2">
            {softStories.map((story) => (
              <NewsCard key={story.slug} story={story} heroName={hero.name} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-6">
        <SectionHeading
          eyebrow="Related Heroes"
          title="Neighbor universes"
          description="Shared tags and strategic overlap drive hero recommendations."
        />
        <div className="grid gap-5 md:grid-cols-3">
          {relatedHeroes.map((relatedHero) => (
            <HeroCard key={relatedHero.slug} hero={relatedHero} compact />
          ))}
        </div>
      </section>
    </div>
  );
}

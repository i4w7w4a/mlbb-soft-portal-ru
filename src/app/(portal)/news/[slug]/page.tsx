import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { HeroCard } from "@/components/cards/hero-card";
import { NewsCard } from "@/components/cards/news-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  getAllHeroes,
  getAllNews,
  getHeroBySlug,
  getNewsBySlug,
  getPreviousNextNews,
  getRelatedNews,
} from "@/lib/content/repository";
import { createMetadata, createNewsMetadata } from "@/lib/seo";

export async function generateStaticParams() {
  const news = await getAllNews(true);
  return news.map((story) => ({ slug: story.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const story = await getNewsBySlug(slug, true);

  if (!story) {
    return createMetadata({
      title: "News",
      description: "News page",
    });
  }

  const hero = await getHeroBySlug(story.heroSlug);
  return createNewsMetadata(story, hero?.name);
}

export default async function NewsArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const story = await getNewsBySlug(slug, true);

  if (!story) {
    notFound();
  }

  const [hero, relatedStories, pagination, heroes] = await Promise.all([
    getHeroBySlug(story.heroSlug),
    getRelatedNews(story),
    getPreviousNextNews(story.slug),
    getAllHeroes(),
  ]);

  return (
    <div className="mx-auto flex w-[min(100%-1.5rem,74rem)] flex-col gap-10">
      <Card className="space-y-6 p-8 md:p-10">
        <div className="flex flex-wrap gap-3">
          <Badge variant={story.isSoft ? "soft" : "default"}>
            {story.isSoft ? "SOFT" : story.category}
          </Badge>
          <Badge>{hero?.name ?? story.heroSlug}</Badge>
          <Badge variant="highlight">{story.status}</Badge>
        </div>
        <div className="space-y-4">
          <h1 className="font-display text-4xl leading-tight text-white md:text-6xl">
            {story.title}
          </h1>
          <p className="max-w-3xl text-lg leading-8 text-slate-300">{story.excerpt}</p>
        </div>
        <div className="flex flex-wrap gap-4 text-xs uppercase tracking-[0.24em] text-slate-500">
          <span>{new Date(story.publishedAt).toLocaleDateString("en-US")}</span>
          <span>{story.readingTime} min read</span>
          <span>{story.author}</span>
        </div>
      </Card>

      <article className="article-shell rounded-[32px] border border-white/8 bg-white/4 px-6 py-8 md:px-12 md:py-10">
        <Markdown remarkPlugins={[remarkGfm]}>{story.contentMarkdown}</Markdown>
      </article>

      {hero ? (
        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <HeroCard hero={hero} compact />
          <Card className="space-y-3">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">More about this hero</p>
            <p className="font-display text-3xl text-white">{hero.name}</p>
            <p className="text-sm leading-7 text-slate-300">{hero.excerpt}</p>
            <Link href={`/heroes/${hero.slug}`} className="text-sm text-cyan-100 hover:text-cyan-50">
              Open hero page
            </Link>
          </Card>
        </section>
      ) : null}

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-3xl text-white">Related materials</h2>
          <div className="flex gap-4 text-sm text-slate-300">
            {pagination.previous ? <Link href={`/news/${pagination.previous.slug}`}>Previous</Link> : null}
            {pagination.next ? <Link href={`/news/${pagination.next.slug}`}>Next</Link> : null}
          </div>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {relatedStories.map((relatedStory) => (
            <NewsCard
              key={relatedStory.slug}
              story={relatedStory}
              heroName={heroes.find((entry) => entry.slug === relatedStory.heroSlug)?.name}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

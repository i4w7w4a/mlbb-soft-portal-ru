import Link from "next/link";

import { EmptyState } from "@/components/feedback/empty-state";
import { Card } from "@/components/ui/card";
import type { Hero, News, TaxonomyTag } from "@/lib/content/schemas";

export function SearchOverview({
  heroes,
  news,
  tags,
}: {
  heroes: Hero[];
  news: News[];
  tags: TaxonomyTag[];
}) {
  const total = heroes.length + news.length + tags.length;

  if (!total) {
    return (
      <EmptyState
        eyebrow="Search Results"
        title="No linked entities came back."
        description="Try a broader phrase, a hero name, or one of the SOFT/meta keywords used across the portal taxonomy."
        tone="soft"
      />
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1.1fr_0.8fr]">
      <Card className="space-y-4">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Heroes</p>
        {heroes.length ? (
          heroes.map((hero) => (
            <Link key={hero.slug} href={`/heroes/${hero.slug}`} className="block text-white hover:text-cyan-100">
              {hero.name}
              <span className="ml-2 text-slate-500">{hero.title}</span>
            </Link>
          ))
        ) : (
          <div className="rounded-[1.4rem] border border-dashed border-white/10 bg-white/3 px-4 py-5 text-sm text-slate-400">
            No heroes match this search.
          </div>
        )}
      </Card>
      <Card className="space-y-4">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">News</p>
        {news.length ? (
          news.map((story) => (
            <Link key={story.slug} href={`/news/${story.slug}`} className="block text-white hover:text-cyan-100">
              {story.title}
            </Link>
          ))
        ) : (
          <div className="rounded-[1.4rem] border border-dashed border-white/10 bg-white/3 px-4 py-5 text-sm text-slate-400">
            No stories match this search.
          </div>
        )}
      </Card>
      <Card className="space-y-4">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Tags</p>
        {tags.length ? (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag.slug} className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-sm text-slate-200">
                {tag.label}
              </span>
            ))}
          </div>
        ) : (
          <div className="rounded-[1.4rem] border border-dashed border-white/10 bg-white/3 px-4 py-5 text-sm text-slate-400">
            No taxonomy terms match this search.
          </div>
        )}
      </Card>
    </div>
  );
}

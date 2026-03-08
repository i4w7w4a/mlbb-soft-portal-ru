import Link from "next/link";

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
  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1.1fr_0.8fr]">
      <Card className="space-y-4">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Heroes</p>
        {heroes.map((hero) => (
          <Link key={hero.slug} href={`/heroes/${hero.slug}`} className="block text-white hover:text-cyan-100">
            {hero.name}
            <span className="ml-2 text-slate-500">{hero.title}</span>
          </Link>
        ))}
      </Card>
      <Card className="space-y-4">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">News</p>
        {news.map((story) => (
          <Link key={story.slug} href={`/news/${story.slug}`} className="block text-white hover:text-cyan-100">
            {story.title}
          </Link>
        ))}
      </Card>
      <Card className="space-y-4">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Tags</p>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={tag.slug} className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-sm text-slate-200">
              {tag.label}
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
}


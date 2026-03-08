"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Hero, News } from "@/lib/content/schemas";

export function CommandPalette({
  heroes,
  news,
}: {
  heroes: Hero[];
  news: News[];
}) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return {
        heroes: heroes.slice(0, 5),
        news: news.slice(0, 5),
      };
    }

    return {
      heroes: heroes.filter((hero) =>
        `${hero.name} ${hero.title}`.toLowerCase().includes(normalized),
      ),
      news: news.filter((story) =>
        `${story.title} ${story.excerpt}`.toLowerCase().includes(normalized),
      ),
    };
  }, [heroes, news, query]);

  return (
    <Dialog>
      <DialogTrigger className="inline-flex h-11 items-center gap-3 rounded-full border border-white/10 bg-white/6 px-5 text-sm text-slate-300 transition-colors hover:border-white/20 hover:text-white">
        <Search className="size-4" />
        Search the portal
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Command Search</DialogTitle>
          <DialogDescription>
            Find heroes, editorials and SOFT signals without leaving the current page.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6 space-y-6">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search heroes, topics, tags..."
            aria-label="Search the portal"
          />
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Heroes</p>
              <div className="space-y-2">
                {results.heroes.slice(0, 5).map((hero) => (
                  <Link
                    key={hero.slug}
                    href={`/heroes/${hero.slug}`}
                    className="block rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-slate-200 transition-colors hover:border-cyan-300/30 hover:text-white"
                  >
                    {hero.name}
                    <span className="ml-2 text-slate-500">{hero.title}</span>
                  </Link>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Stories</p>
              <div className="space-y-2">
                {results.news.slice(0, 5).map((story) => (
                  <Link
                    key={story.slug}
                    href={`/news/${story.slug}`}
                    className="block rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-slate-200 transition-colors hover:border-cyan-300/30 hover:text-white"
                  >
                    {story.title}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <Link href={`/search?q=${encodeURIComponent(query)}`} className="inline-flex text-sm text-cyan-100 hover:text-cyan-50">
            Open full search page
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}


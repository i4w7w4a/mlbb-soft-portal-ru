"use client";

import type { Route } from "next";
import {
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ArrowUpRight, Search } from "lucide-react";

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
import { rankSearchContent } from "@/lib/search";
import { cn } from "@/lib/utils";

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  );
}

export function CommandPalette({
  heroes,
  news,
  className,
}: {
  heroes: Hero[];
  news: News[];
  className?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const inputRef = useRef<HTMLInputElement>(null);
  const currentSearchQuery = searchParams.get("q")?.trim() ?? "";
  const normalizedQuery = query.trim();

  const results = rankSearchContent({
    query: deferredQuery,
    heroes,
    news,
    tags: [],
  });

  const totalResults = results.heroes.length + results.news.length;

  function openFullSearch() {
    const targetQuery = query.trim() || currentSearchQuery;
    const href = targetQuery
      ? (`/search?q=${encodeURIComponent(targetQuery)}` as Route)
      : ("/search" as Route);

    setOpen(false);
    window.location.assign(href);
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setQuery(pathname.startsWith("/search") ? currentSearchQuery : "");
    }

    setOpen(nextOpen);

    if (!nextOpen) {
      setQuery(pathname.startsWith("/search") ? currentSearchQuery : "");
    }
  };

  const handleGlobalShortcut = useEffectEvent((event: KeyboardEvent) => {
    const key = event.key.toLowerCase();

    if ((event.metaKey || event.ctrlKey) && key === "k") {
      event.preventDefault();
      setOpen(true);
      return;
    }

    if (key === "/" && !event.metaKey && !event.ctrlKey && !isEditableTarget(event.target)) {
      event.preventDefault();
      setOpen(true);
    }
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => handleGlobalShortcut(event);

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        className={cn(
          "inline-flex h-11 w-full items-center justify-between gap-3 rounded-full border border-white/10 bg-white/6 px-4 text-sm text-slate-300 transition-colors duration-200 hover:border-white/20 hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/40",
          className,
        )}
        aria-label="Open command search"
      >
        <span className="flex min-w-0 items-center gap-3">
          <Search className="size-4 shrink-0" />
          <span className="truncate">
            <span className="hidden sm:inline">Search heroes, stories, tags</span>
            <span className="sm:hidden">Search the portal</span>
          </span>
        </span>
        <span className="hidden items-center gap-1 rounded-full border border-white/10 bg-black/20 px-2 py-1 text-[10px] uppercase tracking-[0.22em] text-slate-400 md:inline-flex">
          <span>Ctrl</span>
          <span>K</span>
        </span>
      </DialogTrigger>
      <DialogContent className="max-h-[min(84vh,44rem)] overflow-hidden p-0">
        <DialogHeader className="border-b border-white/8 px-6 py-5">
          <DialogTitle>Command Search</DialogTitle>
          <DialogDescription>
            Find heroes, editorial threads, and SOFT signals from anywhere in the portal.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 px-6 py-6">
          <div className="space-y-3">
            <Input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  openFullSearch();
                }
              }}
              placeholder="Try Aamon, jungle tempo, SOFT, patch..."
              aria-label="Search the portal"
            />
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.22em] text-slate-500">
              <span>{normalizedQuery ? `Results: ${totalResults}` : "Curated quick entry"}</span>
              <span className="hidden sm:inline">Press / from anywhere</span>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Heroes</p>
              <div className="space-y-2">
                {results.heroes.slice(0, 5).map((hero) => (
                  <Link
                    key={hero.slug}
                    href={`/heroes/${hero.slug}`}
                    onClick={() => setOpen(false)}
                    className="block rounded-[1.4rem] border border-white/8 bg-white/5 px-4 py-3 text-sm text-slate-200 transition-colors duration-200 hover:border-cyan-300/30 hover:text-white"
                  >
                    <span className="font-medium text-white">{hero.name}</span>
                    <span className="ml-2 text-slate-500">{hero.title}</span>
                  </Link>
                ))}
                {results.heroes.length === 0 ? (
                  <div className="rounded-[1.4rem] border border-dashed border-white/10 bg-white/3 px-4 py-5 text-sm text-slate-400">
                    No heroes match this query yet.
                  </div>
                ) : null}
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Stories</p>
              <div className="space-y-2">
                {results.news.slice(0, 5).map((story) => (
                  <Link
                    key={story.slug}
                    href={`/news/${story.slug}`}
                    onClick={() => setOpen(false)}
                    className="block rounded-[1.4rem] border border-white/8 bg-white/5 px-4 py-3 text-sm text-slate-200 transition-colors duration-200 hover:border-cyan-300/30 hover:text-white"
                  >
                    <span className="block font-medium text-white">{story.title}</span>
                    <span className="mt-1 block line-clamp-2 text-xs leading-5 text-slate-400">
                      {story.excerpt}
                    </span>
                  </Link>
                ))}
                {results.news.length === 0 ? (
                  <div className="rounded-[1.4rem] border border-dashed border-white/10 bg-white/3 px-4 py-5 text-sm text-slate-400">
                    No stories match this query yet.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Signals</p>
            <div className="flex flex-wrap gap-2">
              {["SOFT", "Patch", "Jungle", "Meta", "Aamon", "Xavier"].map((signal) => (
                <button
                  key={signal}
                  type="button"
                  onClick={() => setQuery(signal)}
                  className="rounded-full border border-white/10 bg-white/4 px-3 py-2 text-xs uppercase tracking-[0.22em] text-slate-300 transition-colors hover:border-cyan-300/24 hover:text-white"
                >
                  {signal}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-4">
            <p className="text-sm leading-6 text-slate-400">
              Use full search when you want grouped results, filters, and deeper browsing.
            </p>
            <button
              type="button"
              onClick={openFullSearch}
              className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100 transition-colors duration-200 hover:bg-cyan-300/16 hover:text-cyan-50"
            >
              Open full search
              <ArrowUpRight className="size-4" />
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

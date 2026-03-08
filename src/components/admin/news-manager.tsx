"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDeferredValue, useMemo, useState, useTransition } from "react";
import {
  ArrowUpRight,
  Copy,
  Download,
  FileJson,
  LoaderCircle,
  Plus,
  Upload,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { newsSchema, type Hero, type News } from "@/lib/content/schemas";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const selectClassName =
  "h-12 w-full rounded-2xl border border-white/12 bg-black/30 px-4 text-sm text-white outline-none transition-colors focus:border-cyan-300/45 focus:ring-2 focus:ring-cyan-300/20";

function parseImportInput(value: string) {
  if (!value.trim()) {
    return {
      stories: null,
      error: "Paste a JSON array of stories or a full export snapshot to import.",
    };
  }

  try {
    const raw = JSON.parse(value) as unknown;
    const entries = Array.isArray(raw)
      ? raw
      : raw && typeof raw === "object" && Array.isArray((raw as { news?: unknown[] }).news)
        ? (raw as { news: unknown[] }).news
        : null;

    if (!entries) {
      return {
        stories: null,
        error: "Expected either an array of news items or an object with a news field.",
      };
    }

    return {
      stories: entries.map((entry) => newsSchema.parse(entry)),
      error: null,
    };
  } catch (error) {
    return {
      stories: null,
      error: error instanceof Error ? error.message : "Import payload is invalid.",
    };
  }
}

function downloadFile(blob: Blob, fileName: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  window.URL.revokeObjectURL(url);
}

export function NewsManager({
  heroes,
  news,
}: {
  heroes: Hero[];
  news: News[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [heroFilter, setHeroFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [softFilter, setSoftFilter] = useState("all");
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importValue, setImportValue] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<"export" | "import" | null>(null);
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [isRefreshing, startRefresh] = useTransition();
  const deferredQuery = useDeferredValue(query);

  const heroMap = useMemo(
    () => new Map(heroes.map((hero) => [hero.slug, hero.name])),
    [heroes],
  );

  const visibleStories = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();

    return news.filter((story) => {
      const matchesQuery =
        !normalizedQuery ||
        [story.title, story.slug, story.excerpt, heroMap.get(story.heroSlug) ?? ""].some((value) =>
          value.toLowerCase().includes(normalizedQuery),
        );
      const matchesHero = heroFilter === "all" || story.heroSlug === heroFilter;
      const matchesStatus = statusFilter === "all" || story.status === statusFilter;
      const matchesSoft =
        softFilter === "all" ||
        (softFilter === "soft" ? story.isSoft : !story.isSoft);

      return matchesQuery && matchesHero && matchesStatus && matchesSoft;
    });
  }, [deferredQuery, heroFilter, heroMap, news, softFilter, statusFilter]);

  const counts = useMemo(
    () => ({
      total: news.length,
      published: news.filter((story) => story.status === "published").length,
      draft: news.filter((story) => story.status === "draft").length,
      soft: news.filter((story) => story.isSoft).length,
    }),
    [news],
  );

  const importPreview = useMemo(() => parseImportInput(importValue), [importValue]);

  function refreshNewsList() {
    startRefresh(() => {
      router.refresh();
    });
  }

  function resetFeedback() {
    setMessage(null);
    setError(null);
  }

  async function handleDuplicate(slug: string) {
    resetFeedback();
    setBusySlug(slug);

    try {
      const response = await fetch("/api/admin/news/duplicate", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ slug }),
      });
      const data = (await response.json()) as { error?: string; duplicate?: News };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to duplicate story.");
      }

      setMessage(`Created draft duplicate: ${data.duplicate?.slug ?? slug}.`);
      refreshNewsList();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to duplicate story.");
    } finally {
      setBusySlug(null);
    }
  }

  async function handleExport() {
    resetFeedback();
    setBusyAction("export");

    try {
      const response = await fetch("/api/admin/export");

      if (!response.ok) {
        throw new Error("Failed to export current news snapshot.");
      }

      const blob = await response.blob();
      downloadFile(blob, `portal-export-${new Date().toISOString().slice(0, 10)}.json`);
      setMessage("Export downloaded. The same snapshot format can be pasted back into import.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to export snapshot.");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleImport() {
    resetFeedback();

    if (!importPreview.stories) {
      setError(importPreview.error ?? "Import payload is invalid.");
      return;
    }

    setBusyAction("import");

    try {
      const response = await fetch("/api/admin/news/import", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ news: importPreview.stories }),
      });
      const data = (await response.json()) as { error?: string; imported?: number };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to import stories.");
      }

      setMessage(
        `Imported ${data.imported ?? importPreview.stories.length} stories into the content layer.`,
      );
      setImportDialogOpen(false);
      setImportValue("");
      refreshNewsList();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to import stories.");
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div className="space-y-6">
      {message ? (
        <Card className="border-cyan-300/20 bg-[radial-gradient(circle_at_top,rgba(101,230,255,0.18),transparent_46%),linear-gradient(180deg,rgba(7,28,39,0.96),rgba(5,12,18,0.98))] text-cyan-50">
          <p aria-live="polite" className="text-sm leading-6">
            {message}
          </p>
        </Card>
      ) : null}
      {error ? (
        <Card className="border-rose-300/20 bg-[radial-gradient(circle_at_top,rgba(251,113,133,0.16),transparent_46%),linear-gradient(180deg,rgba(32,11,18,0.96),rgba(18,5,9,0.98))] text-rose-100">
          <p aria-live="polite" className="text-sm leading-6">
            {error}
          </p>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="space-y-2">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">All stories</p>
          <p className="font-display text-4xl text-white">{counts.total}</p>
        </Card>
        <Card className="space-y-2">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Published</p>
          <p className="font-display text-4xl text-white">{counts.published}</p>
        </Card>
        <Card className="space-y-2">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Drafts</p>
          <p className="font-display text-4xl text-white">{counts.draft}</p>
        </Card>
        <Card className="space-y-2">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">SOFT lines</p>
          <p className="font-display text-4xl text-white">{counts.soft}</p>
        </Card>
      </div>

      <Card className="space-y-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="soft">Ops live</Badge>
              <Badge>JSON-first</Badge>
            </div>
            <div>
              <p className="font-display text-3xl text-white">
                Operate editorial output without leaving the queue
              </p>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                Duplicate draft variants, round-trip JSON exports, and bulk import stories
                from exported snapshots or raw arrays.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/news/new"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/12 bg-white/6 px-5 text-sm font-medium text-white transition-colors hover:border-white/24 hover:bg-white/10"
            >
              <Plus className="size-4" />
              New story
            </Link>
            <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" type="button">
                  <Upload className="size-4" />
                  Import JSON
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Bulk import stories</DialogTitle>
                  <DialogDescription>
                    Paste a JSON array of stories or the full payload downloaded from export.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                  <div className="space-y-3">
                    <Label htmlFor="import-json">Import payload</Label>
                    <Textarea
                      id="import-json"
                      className="min-h-[22rem] font-mono text-sm"
                      placeholder='[{ "slug": "new-story", "heroSlug": "aamon", ... }]'
                      value={importValue}
                      onChange={(event) => setImportValue(event.target.value)}
                    />
                    <div className="flex flex-wrap gap-3">
                      <Button
                        type="button"
                        onClick={() => void handleImport()}
                        disabled={busyAction === "import"}
                      >
                        {busyAction === "import" ? (
                          <LoaderCircle className="size-4 animate-spin" />
                        ) : (
                          <FileJson className="size-4" />
                        )}
                        Validate and import
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setImportValue("");
                          resetFeedback();
                        }}
                      >
                        Clear payload
                      </Button>
                    </div>
                  </div>
                  <Card className="space-y-4 border-white/8 bg-black/20 p-5">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                      Parsed preview
                    </p>
                    {importPreview.stories ? (
                      <>
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="rounded-2xl border border-white/10 bg-white/4 px-4 py-3">
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                              Stories
                            </p>
                            <p className="mt-2 font-display text-3xl text-white">
                              {importPreview.stories.length}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-white/4 px-4 py-3">
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                              Drafts
                            </p>
                            <p className="mt-2 font-display text-3xl text-white">
                              {
                                importPreview.stories.filter(
                                  (story) => story.status === "draft",
                                ).length
                              }
                            </p>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-white/4 px-4 py-3">
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                              SOFT
                            </p>
                            <p className="mt-2 font-display text-3xl text-white">
                              {importPreview.stories.filter((story) => story.isSoft).length}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {importPreview.stories.slice(0, 4).map((story) => (
                            <div
                              key={story.id}
                              className="rounded-2xl border border-white/10 bg-white/4 px-4 py-3"
                            >
                              <p className="text-sm font-medium text-white">{story.title}</p>
                              <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-500">
                                {heroMap.get(story.heroSlug) ?? story.heroSlug} · {story.status}
                              </p>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-sm leading-6 text-slate-400">{importPreview.error}</p>
                    )}
                  </Card>
                </div>
              </DialogContent>
            </Dialog>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void handleExport()}
              disabled={busyAction === "export"}
            >
              {busyAction === "export" ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              Export JSON
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,0.8fr))]">
          <div className="space-y-2">
            <Label htmlFor="news-query">Search stories</Label>
            <Input
              id="news-query"
              placeholder="Search by title, slug, excerpt, or hero"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hero-filter">Hero</Label>
            <select
              id="hero-filter"
              className={selectClassName}
              value={heroFilter}
              onChange={(event) => setHeroFilter(event.target.value)}
            >
              <option value="all">All heroes</option>
              {heroes.map((hero) => (
                <option key={hero.slug} value={hero.slug}>
                  {hero.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status-filter">Status</Label>
            <select
              id="status-filter"
              className={selectClassName}
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="soft-filter">SOFT</Label>
            <select
              id="soft-filter"
              className={selectClassName}
              value={softFilter}
              onChange={(event) => setSoftFilter(event.target.value)}
            >
              <option value="all">All lines</option>
              <option value="soft">SOFT only</option>
              <option value="standard">Standard only</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-400">
          <p>
            Showing <span className="text-white">{visibleStories.length}</span> of{" "}
            <span className="text-white">{news.length}</span> stories.
          </p>
          {isRefreshing ? (
            <div className="inline-flex items-center gap-2 text-cyan-100">
              <LoaderCircle className="size-4 animate-spin" />
              Refreshing admin snapshot
            </div>
          ) : null}
        </div>
      </Card>

      <div className="grid gap-4">
        {visibleStories.length ? (
          visibleStories.map((story) => (
            <Card
              key={story.slug}
              className="space-y-4 border-white/8 bg-[radial-gradient(circle_at_top_right,rgba(101,230,255,0.1),transparent_28%),linear-gradient(180deg,rgba(10,17,30,0.9),rgba(5,9,18,0.95))]"
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={story.status === "published" ? "highlight" : "default"}>
                      {story.status}
                    </Badge>
                    {story.isSoft ? <Badge variant="soft">SOFT</Badge> : null}
                    <Badge>{heroMap.get(story.heroSlug) ?? story.heroSlug}</Badge>
                    <Badge>{story.category}</Badge>
                  </div>
                  <div>
                    <p className="font-display text-[clamp(1.5rem,2.4vw,2.4rem)] text-white">
                      {story.title}
                    </p>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                      {story.excerpt}
                    </p>
                  </div>
                </div>
                <div className="grid gap-2 text-sm text-slate-300 sm:grid-cols-2 xl:min-w-[17rem] xl:grid-cols-1 xl:text-right">
                  <p>
                    <span className="text-slate-500">Published</span>
                    <br />
                    {dateFormatter.format(new Date(story.publishedAt))}
                  </p>
                  <p>
                    <span className="text-slate-500">Reading time</span>
                    <br />
                    {story.readingTime} min
                  </p>
                  <p>
                    <span className="text-slate-500">Tags</span>
                    <br />
                    {story.tags.length ? story.tags.join(", ") : "No tags"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => void handleDuplicate(story.slug)}
                  disabled={busySlug === story.slug}
                >
                  {busySlug === story.slug ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                  Duplicate
                </Button>
                <Link
                  href={`/news/${story.slug}`}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-white/12 px-4 text-sm font-medium text-slate-200 transition-colors hover:border-cyan-300/20 hover:text-white"
                >
                  View live
                  <ArrowUpRight className="size-4" />
                </Link>
              </div>
            </Card>
          ))
        ) : (
          <Card className="space-y-3 text-center">
            <p className="font-display text-3xl text-white">
              No stories match the current operator view
            </p>
            <p className="mx-auto max-w-2xl text-sm leading-6 text-slate-400">
              Reset the filters or import a fresh JSON payload to repopulate the queue.
            </p>
            <div className="flex justify-center gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setQuery("");
                  setHeroFilter("all");
                  setStatusFilter("all");
                  setSoftFilter("all");
                }}
              >
                Reset filters
              </Button>
              <Button type="button" onClick={() => setImportDialogOpen(true)}>
                <Upload className="size-4" />
                Import stories
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

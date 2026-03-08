"use client";

import { useMemo, useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { newsSchema, type Hero, type News } from "@/lib/content/schemas";

function createInitialDraft(heroSlug: string): News {
  return newsSchema.parse({
    id: "2026-03-12-new-story",
    slug: "new-story",
    title: "New Story",
    excerpt: "Short teaser",
    heroSlug,
    cover: `/images/heroes/${heroSlug}/cover.svg`,
    status: "draft",
    isSoft: false,
    isFeatured: false,
    category: "news",
    tags: [],
    author: "Admin",
    publishedAt: new Date().toISOString(),
    readingTime: 3,
    seo: {
      title: "New Story - MLBB Portal",
      description: "Short teaser",
    },
    contentMarkdown: "# New Story\n\nStart writing here.",
  });
}

export function NewsEditor({ heroes }: { heroes: Hero[] }) {
  const [formState, setFormState] = useState<News>(() =>
    createInitialDraft(heroes[0]?.slug ?? "aamon"),
  );
  const [jsonValue, setJsonValue] = useState(JSON.stringify(formState, null, 2));
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parsedJson = useMemo(() => {
    try {
      return newsSchema.parse(JSON.parse(jsonValue));
    } catch {
      return null;
    }
  }, [jsonValue]);

  async function persistStory(payload: News) {
    setError(null);
    setMessage(null);

    const response = await fetch("/api/admin/news/save", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Failed to save the story.");
      return;
    }

    setMessage("Story saved to the JSON content layer.");
    setJsonValue(JSON.stringify(payload, null, 2));
  }

  return (
    <Tabs defaultValue="form">
      <TabsList>
        <TabsTrigger value="form">Form mode</TabsTrigger>
        <TabsTrigger value="json">JSON mode</TabsTrigger>
      </TabsList>
      <TabsContent value="form">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="hero">Hero</Label>
                <select
                  id="hero"
                  value={formState.heroSlug}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      heroSlug: event.target.value,
                      cover: `/images/heroes/${event.target.value}/cover.svg`,
                    }))
                  }
                  className="h-12 w-full rounded-2xl border border-white/12 bg-black/30 px-4 text-sm text-white outline-none"
                >
                  {heroes.map((hero) => (
                    <option key={hero.slug} value={hero.slug}>
                      {hero.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formState.title}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      title: event.target.value,
                      seo: { ...current.seo, title: `${event.target.value} - MLBB Portal` },
                    }))
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  className="min-h-24"
                  value={formState.excerpt}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      excerpt: event.target.value,
                      seo: { ...current.seo, description: event.target.value },
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formState.category}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, category: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  value={formState.tags.join(", ")}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      tags: event.target.value
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean),
                    }))
                  }
                />
              </div>
              <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/4 px-4 py-3 text-sm text-slate-200">
                SOFT toggle
                <input
                  type="checkbox"
                  checked={formState.isSoft}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, isSoft: event.target.checked }))
                  }
                  className="size-4 accent-cyan-300"
                />
              </label>
              <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/4 px-4 py-3 text-sm text-slate-200">
                Featured toggle
                <input
                  type="checkbox"
                  checked={formState.isFeatured}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, isFeatured: event.target.checked }))
                  }
                  className="size-4 accent-cyan-300"
                />
              </label>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="markdown">Body</Label>
                <Textarea
                  id="markdown"
                  value={formState.contentMarkdown}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      contentMarkdown: event.target.value,
                      readingTime: Math.max(
                        1,
                        Math.ceil(event.target.value.split(/\s+/).length / 220),
                      ),
                    }))
                  }
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => {
                  setJsonValue(JSON.stringify(formState, null, 2));
                  void persistStory(formState);
                }}
              >
                Save as draft
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  const published = { ...formState, status: "published" as const };
                  setFormState(published);
                  setJsonValue(JSON.stringify(published, null, 2));
                  void persistStory(published);
                }}
              >
                Publish
              </Button>
            </div>
          </Card>
          <Card className="space-y-5">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Preview</p>
            <div className="space-y-3">
              <p className="font-display text-3xl text-white">{formState.title}</p>
              <p className="text-sm text-slate-400">{formState.excerpt}</p>
              <div className="flex gap-2 text-xs uppercase tracking-[0.24em] text-slate-500">
                <span>{formState.heroSlug}</span>
                <span>{formState.category}</span>
                <span>{formState.status}</span>
              </div>
              <div className="rounded-[24px] border border-white/8 bg-white/4 p-4">
                <pre className="overflow-x-auto whitespace-pre-wrap text-xs text-slate-300">
                  {formState.contentMarkdown}
                </pre>
              </div>
              {message ? <p className="text-sm text-cyan-100">{message}</p> : null}
              {error ? <p className="text-sm text-rose-300">{error}</p> : null}
            </div>
          </Card>
        </div>
      </TabsContent>
      <TabsContent value="json">
        <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <Card className="space-y-4">
            <Label htmlFor="json-editor">JSON payload</Label>
            <Textarea
              id="json-editor"
              className="min-h-[30rem] font-mono text-sm"
              value={jsonValue}
              onChange={(event) => setJsonValue(event.target.value)}
            />
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  if (!parsedJson) {
                    setError("JSON payload is invalid.");
                    setMessage(null);
                    return;
                  }

                  setFormState(parsedJson);
                  void persistStory(parsedJson);
                }}
              >
                Validate and save
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  try {
                    const parsed = newsSchema.parse(JSON.parse(jsonValue));
                    setFormState(parsed);
                    setError(null);
                    setMessage("JSON parsed successfully.");
                  } catch (nextError) {
                    setError(
                      nextError instanceof Error ? nextError.message : "Invalid JSON payload.",
                    );
                  }
                }}
              >
                Parse preview
              </Button>
            </div>
          </Card>
          <Card className="space-y-4">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Parsed preview</p>
            {parsedJson ? (
              <>
                <p className="font-display text-3xl text-white">{parsedJson.title}</p>
                <p className="text-sm text-slate-400">{parsedJson.excerpt}</p>
                <pre className="overflow-x-auto whitespace-pre-wrap rounded-[24px] border border-white/8 bg-white/4 p-4 text-xs text-slate-300">
                  {JSON.stringify(parsedJson, null, 2)}
                </pre>
              </>
            ) : (
              <p className="text-sm text-slate-400">JSON is not valid yet.</p>
            )}
            {message ? <p className="text-sm text-cyan-100">{message}</p> : null}
            {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";
import { ArrowUpRight, LoaderCircle, Plus, Save, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  heroDifficultyValues,
  heroRoleValues,
  laneValues,
  taxonomyTagKindValues,
  type Hero,
  type TaxonomyCategory,
  type TaxonomyTag,
} from "@/lib/content/schemas";
import { cn, unique } from "@/lib/utils";

const selectClassName =
  "h-12 w-full rounded-2xl border border-white/12 bg-black/30 px-4 text-sm text-white outline-none transition-colors focus:border-cyan-300/45 focus:ring-2 focus:ring-cyan-300/20";

function parseListInput(value: string) {
  return unique(value.split(",").map((item) => item.trim()).filter(Boolean));
}

function toggleValue<T extends string>(values: T[], value: T) {
  return values.includes(value)
    ? values.filter((entry) => entry !== value)
    : [...values, value];
}

function Notice({
  tone,
  children,
}: {
  tone: "success" | "error";
  children: React.ReactNode;
}) {
  return (
    <Card
      className={cn(
        "text-sm leading-6",
        tone === "success"
          ? "border-cyan-300/20 bg-[radial-gradient(circle_at_top,rgba(101,230,255,0.18),transparent_46%),linear-gradient(180deg,rgba(7,28,39,0.96),rgba(5,12,18,0.98))] text-cyan-50"
          : "border-rose-300/20 bg-[radial-gradient(circle_at_top,rgba(251,113,133,0.16),transparent_46%),linear-gradient(180deg,rgba(32,11,18,0.96),rgba(18,5,9,0.98))] text-rose-100",
      )}
    >
      <p aria-live="polite">{children}</p>
    </Card>
  );
}

function ChoiceChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex min-h-11 items-center rounded-full border px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "border-cyan-300/30 bg-cyan-300/12 text-cyan-100"
          : "border-white/10 bg-white/4 text-slate-300 hover:border-white/18 hover:text-white",
      )}
    >
      {label}
    </button>
  );
}

export function HeroesManager({
  heroes,
  tags,
  categories,
  storyCountByHero,
}: {
  heroes: Hero[];
  tags: TaxonomyTag[];
  categories: TaxonomyCategory[];
  storyCountByHero: Record<string, number>;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedHeroSlug, setSelectedHeroSlug] = useState(heroes[0]?.slug ?? "");
  const [heroDraft, setHeroDraft] = useState<Hero | null>(heroes[0] ?? null);
  const [taxonomyDraft, setTaxonomyDraft] = useState({ tags, categories });
  const [heroMessage, setHeroMessage] = useState<string | null>(null);
  const [heroError, setHeroError] = useState<string | null>(null);
  const [taxonomyMessage, setTaxonomyMessage] = useState<string | null>(null);
  const [taxonomyError, setTaxonomyError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<"hero" | "taxonomy" | null>(null);
  const [isRefreshing, startRefresh] = useTransition();
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    setHeroDraft(heroes.find((hero) => hero.slug === selectedHeroSlug) ?? null);
  }, [heroes, selectedHeroSlug]);

  useEffect(() => {
    setTaxonomyDraft({ tags, categories });
  }, [categories, tags]);

  const visibleHeroes = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();
    return heroes.filter((hero) => {
      const matchesQuery =
        !normalizedQuery ||
        [hero.name, hero.slug, hero.title, hero.excerpt].some((value) =>
          value.toLowerCase().includes(normalizedQuery),
        );
      const matchesRole =
        roleFilter === "all" || hero.role.includes(roleFilter as Hero["role"][number]);
      return matchesQuery && matchesRole;
    });
  }, [deferredQuery, heroes, roleFilter]);

  const taxonomyCounts = useMemo(
    () =>
      taxonomyTagKindValues.reduce<Record<string, number>>((result, kind) => {
        result[kind] = taxonomyDraft.tags.filter((tag) => tag.kind === kind).length;
        return result;
      }, {}),
    [taxonomyDraft.tags],
  );

  function refreshRoute() {
    startRefresh(() => router.refresh());
  }

  async function handleHeroSave() {
    if (!heroDraft) {
      return;
    }

    setBusyAction("hero");
    setHeroMessage(null);
    setHeroError(null);

    try {
      const response = await fetch("/api/admin/heroes/save", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(heroDraft),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save hero.");
      }

      setHeroMessage(`${heroDraft.name} saved to the JSON content layer.`);
      refreshRoute();
    } catch (error) {
      setHeroError(error instanceof Error ? error.message : "Failed to save hero.");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleTaxonomySave() {
    setBusyAction("taxonomy");
    setTaxonomyMessage(null);
    setTaxonomyError(null);

    try {
      const response = await fetch("/api/admin/taxonomy/save", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(taxonomyDraft),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save taxonomy.");
      }

      setTaxonomyMessage("Tags and categories saved to the taxonomy layer.");
      refreshRoute();
    } catch (error) {
      setTaxonomyError(error instanceof Error ? error.message : "Failed to save taxonomy.");
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <Tabs defaultValue="heroes">
      <TabsList className="max-w-[28rem]">
        <TabsTrigger value="heroes">Hero editor</TabsTrigger>
        <TabsTrigger value="taxonomy">Taxonomy</TabsTrigger>
      </TabsList>

      <TabsContent value="heroes" className="space-y-6">
        {heroMessage ? <Notice tone="success">{heroMessage}</Notice> : null}
        {heroError ? <Notice tone="error">{heroError}</Notice> : null}

        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <Card className="space-y-5">
            <div>
              <p className="font-display text-3xl text-white">Hero roster</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Search the roster, pick a hero, then update the JSON profile without leaving admin.
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hero-search">Search heroes</Label>
                <Input
                  id="hero-search"
                  placeholder="Search by name, slug, title"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hero-role-filter">Role</Label>
                <select
                  id="hero-role-filter"
                  className={selectClassName}
                  value={roleFilter}
                  onChange={(event) => setRoleFilter(event.target.value)}
                >
                  <option value="all">All roles</option>
                  {heroRoleValues.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="max-h-[42rem] space-y-3 overflow-y-auto pr-1">
              {visibleHeroes.map((hero) => (
                <button
                  key={hero.slug}
                  type="button"
                  onClick={() => setSelectedHeroSlug(hero.slug)}
                  className={cn(
                    "w-full rounded-[28px] border px-4 py-4 text-left transition-colors",
                    hero.slug === selectedHeroSlug
                      ? "border-cyan-300/30 bg-cyan-300/10"
                      : "border-white/8 bg-white/4 hover:border-white/16",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-2xl text-white">{hero.name}</p>
                      <p className="mt-1 text-sm text-slate-400">{hero.title}</p>
                    </div>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-300">
                      {storyCountByHero[hero.slug] ?? 0} stories
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {hero.role.map((role) => (
                      <Badge key={`${hero.slug}-${role}`}>{role}</Badge>
                    ))}
                    {hero.isSoftFeatured ? <Badge variant="soft">SOFT</Badge> : null}
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {heroDraft ? (
            <Card className="space-y-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{heroDraft.slug}</Badge>
                    {heroDraft.isSoftFeatured ? <Badge variant="soft">SOFT featured</Badge> : null}
                    <Badge variant="highlight">{storyCountByHero[heroDraft.slug] ?? 0} stories</Badge>
                  </div>
                  <div>
                    <p className="font-display text-3xl text-white">{heroDraft.name}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      Edit positioning, taxonomy, SEO, and feature flags against the same schema the portal reads.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`/heroes/${heroDraft.slug}`}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/12 bg-white/6 px-5 text-sm font-medium text-white transition-colors hover:border-white/24 hover:bg-white/10"
                  >
                    Open live
                    <ArrowUpRight className="size-4" />
                  </Link>
                  <Button type="button" onClick={() => void handleHeroSave()} disabled={busyAction === "hero"}>
                    {busyAction === "hero" ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
                    Save hero
                  </Button>
                </div>
              </div>
              <div className="grid gap-5 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hero-name">Name</Label>
                  <Input
                    id="hero-name"
                    value={heroDraft.name}
                    onChange={(event) =>
                      setHeroDraft((current) => (current ? { ...current, name: event.target.value } : current))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hero-title">Title</Label>
                  <Input
                    id="hero-title"
                    value={heroDraft.title}
                    onChange={(event) =>
                      setHeroDraft((current) => (current ? { ...current, title: event.target.value } : current))
                    }
                  />
                </div>
                <div className="space-y-2 lg:col-span-2">
                  <Label htmlFor="hero-excerpt">Excerpt</Label>
                  <Textarea
                    id="hero-excerpt"
                    className="min-h-28"
                    value={heroDraft.excerpt}
                    onChange={(event) =>
                      setHeroDraft((current) => (current ? { ...current, excerpt: event.target.value } : current))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hero-faction">Faction</Label>
                  <Input
                    id="hero-faction"
                    value={heroDraft.faction ?? ""}
                    onChange={(event) =>
                      setHeroDraft((current) => (current ? { ...current, faction: event.target.value } : current))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hero-signature">Signature</Label>
                  <Input
                    id="hero-signature"
                    value={heroDraft.signature ?? ""}
                    onChange={(event) =>
                      setHeroDraft((current) => (current ? { ...current, signature: event.target.value } : current))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hero-difficulty">Difficulty</Label>
                  <select
                    id="hero-difficulty"
                    className={selectClassName}
                    value={heroDraft.difficulty}
                    onChange={(event) =>
                      setHeroDraft((current) =>
                        current ? { ...current, difficulty: event.target.value as Hero["difficulty"] } : current,
                      )
                    }
                  >
                    {heroDifficultyValues.map((difficulty) => (
                      <option key={difficulty} value={difficulty}>
                        {difficulty}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hero-release-year">Release year</Label>
                  <Input
                    id="hero-release-year"
                    type="number"
                    value={heroDraft.releaseYear}
                    onChange={(event) =>
                      setHeroDraft((current) =>
                        current
                          ? { ...current, releaseYear: Number(event.target.value) || current.releaseYear }
                          : current,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hero-avatar">Avatar path</Label>
                  <Input
                    id="hero-avatar"
                    value={heroDraft.avatar}
                    onChange={(event) =>
                      setHeroDraft((current) => (current ? { ...current, avatar: event.target.value } : current))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hero-cover">Cover path</Label>
                  <Input
                    id="hero-cover"
                    value={heroDraft.cover}
                    onChange={(event) =>
                      setHeroDraft((current) => (current ? { ...current, cover: event.target.value } : current))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hero-accent">Accent</Label>
                  <div className="flex gap-3">
                    <Input
                      id="hero-accent"
                      value={heroDraft.accent}
                      onChange={(event) =>
                        setHeroDraft((current) => (current ? { ...current, accent: event.target.value } : current))
                      }
                    />
                    <input
                      aria-label="Accent color picker"
                      type="color"
                      value={heroDraft.accent}
                      onChange={(event) =>
                        setHeroDraft((current) => (current ? { ...current, accent: event.target.value } : current))
                      }
                      className="h-12 w-14 rounded-2xl border border-white/12 bg-black/30"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hero-specialty">Specialty</Label>
                  <Input
                    id="hero-specialty"
                    value={heroDraft.specialty.join(", ")}
                    onChange={(event) =>
                      setHeroDraft((current) =>
                        current ? { ...current, specialty: parseListInput(event.target.value) } : current,
                      )
                    }
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Roles</Label>
                <div className="flex flex-wrap gap-3">
                  {heroRoleValues.map((role) => (
                    <ChoiceChip
                      key={role}
                      active={heroDraft.role.includes(role)}
                      label={role}
                      onClick={() =>
                        setHeroDraft((current) =>
                          current ? { ...current, role: toggleValue(current.role, role) } : current,
                        )
                      }
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Lanes</Label>
                <div className="flex flex-wrap gap-3">
                  {laneValues.map((lane) => (
                    <ChoiceChip
                      key={lane}
                      active={heroDraft.lane.includes(lane)}
                      label={lane}
                      onClick={() =>
                        setHeroDraft((current) =>
                          current ? { ...current, lane: toggleValue(current.lane, lane) } : current,
                        )
                      }
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-3">
                  {tags.map((tag) => (
                    <ChoiceChip
                      key={tag.slug}
                      active={heroDraft.tags.includes(tag.slug)}
                      label={tag.label}
                      onClick={() =>
                        setHeroDraft((current) =>
                          current ? { ...current, tags: toggleValue(current.tags, tag.slug) } : current,
                        )
                      }
                    />
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex min-h-11 items-center justify-between rounded-2xl border border-white/10 bg-white/4 px-4 py-3 text-sm text-slate-200">
                  Featured
                  <input
                    type="checkbox"
                    checked={heroDraft.isFeatured}
                    onChange={(event) =>
                      setHeroDraft((current) =>
                        current ? { ...current, isFeatured: event.target.checked } : current,
                      )
                    }
                    className="size-4 accent-cyan-300"
                  />
                </label>
                <label className="flex min-h-11 items-center justify-between rounded-2xl border border-white/10 bg-white/4 px-4 py-3 text-sm text-slate-200">
                  SOFT featured
                  <input
                    type="checkbox"
                    checked={heroDraft.isSoftFeatured}
                    onChange={(event) =>
                      setHeroDraft((current) =>
                        current ? { ...current, isSoftFeatured: event.target.checked } : current,
                      )
                    }
                    className="size-4 accent-cyan-300"
                  />
                </label>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hero-seo-title">SEO title</Label>
                  <Input
                    id="hero-seo-title"
                    value={heroDraft.seo.title}
                    onChange={(event) =>
                      setHeroDraft((current) =>
                        current ? { ...current, seo: { ...current.seo, title: event.target.value } } : current,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hero-seo-description">SEO description</Label>
                  <Textarea
                    id="hero-seo-description"
                    className="min-h-28"
                    value={heroDraft.seo.description}
                    onChange={(event) =>
                      setHeroDraft((current) =>
                        current ? { ...current, seo: { ...current.seo, description: event.target.value } } : current,
                      )
                    }
                  />
                </div>
              </div>
            </Card>
          ) : null}
        </div>
      </TabsContent>

      <TabsContent value="taxonomy" className="space-y-6">
        {taxonomyMessage ? <Notice tone="success">{taxonomyMessage}</Notice> : null}
        {taxonomyError ? <Notice tone="error">{taxonomyError}</Notice> : null}

        <Card className="space-y-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="font-display text-3xl text-white">Taxonomy management</p>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                Keep tag kinds and editorial categories aligned with filtering, hero metadata, and story creation.
              </p>
            </div>
            <Button type="button" onClick={() => void handleTaxonomySave()} disabled={busyAction === "taxonomy"}>
              {busyAction === "taxonomy" ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save taxonomy
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {taxonomyTagKindValues.map((kind) => (
              <Card key={kind} className="space-y-2 border-white/8 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{kind}</p>
                <p className="font-display text-3xl text-white">{taxonomyCounts[kind] ?? 0}</p>
              </Card>
            ))}
          </div>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-display text-2xl text-white">Tags</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">Role, lane, topic, and product tags.</p>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  setTaxonomyDraft((current) => ({
                    ...current,
                    tags: [...current.tags, { slug: "", label: "", kind: "topic" }],
                  }))
                }
              >
                <Plus className="size-4" />
                Add tag
              </Button>
            </div>
            <div className="space-y-3">
              {taxonomyDraft.tags.map((tag, index) => (
                <div
                  key={`tag-${index}-${tag.slug || "new"}`}
                  className="grid gap-3 rounded-[28px] border border-white/8 bg-black/20 p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,0.8fr)_auto]"
                >
                  <Input value={tag.slug} onChange={(event) => setTaxonomyDraft((current) => ({ ...current, tags: current.tags.map((entry, currentIndex) => currentIndex === index ? { ...entry, slug: event.target.value } : entry) }))} aria-label={`Tag slug ${index + 1}`} />
                  <Input value={tag.label} onChange={(event) => setTaxonomyDraft((current) => ({ ...current, tags: current.tags.map((entry, currentIndex) => currentIndex === index ? { ...entry, label: event.target.value } : entry) }))} aria-label={`Tag label ${index + 1}`} />
                  <select
                    className={selectClassName}
                    value={tag.kind}
                    onChange={(event) =>
                      setTaxonomyDraft((current) => ({
                        ...current,
                        tags: current.tags.map((entry, currentIndex) =>
                          currentIndex === index ? { ...entry, kind: event.target.value as TaxonomyTag["kind"] } : entry,
                        ),
                      }))
                    }
                    aria-label={`Tag kind ${index + 1}`}
                  >
                    {taxonomyTagKindValues.map((kind) => (
                      <option key={kind} value={kind}>
                        {kind}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      setTaxonomyDraft((current) => ({
                        ...current,
                        tags: current.tags.filter((_, currentIndex) => currentIndex !== index),
                      }))
                    }
                  >
                    <X className="size-4" />
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          <Card className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-display text-2xl text-white">Categories</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">Top-level groupings for stories and features.</p>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  setTaxonomyDraft((current) => ({
                    ...current,
                    categories: [...current.categories, { slug: "", label: "" }],
                  }))
                }
              >
                <Plus className="size-4" />
                Add category
              </Button>
            </div>
            <div className="space-y-3">
              {taxonomyDraft.categories.map((category, index) => (
                <div
                  key={`category-${index}-${category.slug || "new"}`}
                  className="grid gap-3 rounded-[28px] border border-white/8 bg-black/20 p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_auto]"
                >
                  <Input value={category.slug} onChange={(event) => setTaxonomyDraft((current) => ({ ...current, categories: current.categories.map((entry, currentIndex) => currentIndex === index ? { ...entry, slug: event.target.value } : entry) }))} aria-label={`Category slug ${index + 1}`} />
                  <Input value={category.label} onChange={(event) => setTaxonomyDraft((current) => ({ ...current, categories: current.categories.map((entry, currentIndex) => currentIndex === index ? { ...entry, label: event.target.value } : entry) }))} aria-label={`Category label ${index + 1}`} />
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      setTaxonomyDraft((current) => ({
                        ...current,
                        categories: current.categories.filter((_, currentIndex) => currentIndex !== index),
                      }))
                    }
                  >
                    <X className="size-4" />
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {isRefreshing ? (
          <div className="inline-flex items-center gap-2 text-sm text-cyan-100">
            <LoaderCircle className="size-4 animate-spin" />
            Refreshing admin snapshot
          </div>
        ) : null}
      </TabsContent>
    </Tabs>
  );
}

import Link from "next/link";

import { Card } from "@/components/ui/card";
import { getAllHeroes, getAllNews, getSoftNews, getTaxonomy } from "@/lib/content/repository";

export default async function AdminDashboardPage() {
  const [heroes, news, softStories, taxonomy] = await Promise.all([
    getAllHeroes(),
    getAllNews(true),
    getSoftNews(),
    getTaxonomy(),
  ]);

  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Heroes</p>
          <p className="mt-3 font-display text-4xl text-white">{heroes.length}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">News</p>
          <p className="mt-3 font-display text-4xl text-white">{news.length}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">SOFT</p>
          <p className="mt-3 font-display text-4xl text-white">{softStories.length}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Tags</p>
          <p className="mt-3 font-display text-4xl text-white">{taxonomy.tags.length}</p>
        </Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="space-y-4">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Quick actions</p>
          <p className="text-sm leading-6 text-slate-400">
            This operator layer is local-first and writes directly into the typed JSON content graph.
          </p>
          <div className="grid gap-3">
            <Link href="/admin/news/new" className="rounded-2xl border border-white/8 px-4 py-4 text-white hover:border-cyan-300/20">
              Open quick editor
            </Link>
            <Link href="/admin/news" className="rounded-2xl border border-white/8 px-4 py-4 text-white hover:border-cyan-300/20">
              Manage news
            </Link>
            <Link href="/admin/heroes" className="rounded-2xl border border-white/8 px-4 py-4 text-white hover:border-cyan-300/20">
              Review hero catalog
            </Link>
          </div>
        </Card>
        <Card className="space-y-4">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Tags manager</p>
          <p className="text-sm leading-6 text-slate-400">
            Taxonomy edits here stay in-repo, versioned, and immediately visible to the portal.
          </p>
          <div className="flex flex-wrap gap-2">
            {taxonomy.tags.map((tag) => (
              <span key={tag.slug} className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-sm text-slate-200">
                {tag.label}
              </span>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

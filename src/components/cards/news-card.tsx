import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { News } from "@/lib/content/schemas";

export function NewsCard({
  story,
  heroName,
  large = false,
}: {
  story: News;
  heroName?: string;
  large?: boolean;
}) {
  return (
    <Link href={`/news/${story.slug}`} className="group block cursor-pointer">
      <Card className="relative overflow-hidden transition-transform duration-300 group-hover:-translate-y-1 group-hover:border-white/20">
        <div
          className="absolute inset-0 opacity-90"
          style={{
            background: story.isSoft
              ? "radial-gradient(circle at top right, rgba(101,230,255,0.18), transparent 36%)"
              : "radial-gradient(circle at top right, rgba(255,255,255,0.08), transparent 28%)",
          }}
        />
        <div className="relative space-y-5">
          <div className="flex items-center justify-between gap-4">
            <Badge variant={story.isSoft ? "soft" : story.isFeatured ? "highlight" : "default"}>
              {story.isSoft ? "SOFT" : story.category.replace(/-/g, " ")}
            </Badge>
            <span className="text-xs uppercase tracking-[0.24em] text-slate-500">
              {story.readingTime} min
            </span>
          </div>
          <div className="space-y-3">
            <h3 className={large ? "font-display text-3xl text-white" : "font-display text-2xl text-white"}>
              {story.title}
            </h3>
            <p className="text-sm leading-6 text-slate-300">{story.excerpt}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.24em] text-slate-500">
            {heroName ? <span>{heroName}</span> : null}
            <span>{new Date(story.publishedAt).toLocaleDateString("en-US")}</span>
            <span>{story.status}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}


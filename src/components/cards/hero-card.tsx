import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Hero } from "@/lib/content/schemas";

export function HeroCard({
  hero,
  compact = false,
}: {
  hero: Hero;
  compact?: boolean;
}) {
  return (
    <Link href={`/heroes/${hero.slug}`} className="group block cursor-pointer">
      <Card className="relative overflow-hidden border-white/8 transition-transform duration-300 group-hover:-translate-y-1 group-hover:border-cyan-300/25">
        <div
          className="absolute inset-0 opacity-80"
          style={{
            background: `radial-gradient(circle at top right, ${hero.accent}40, transparent 32%), linear-gradient(180deg, rgba(5,9,18,0), rgba(5,9,18,0.9))`,
          }}
        />
        <div className="relative flex h-full flex-col justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant={hero.isSoftFeatured ? "soft" : "default"}>
                {hero.isSoftFeatured ? "SOFT Hero" : hero.role[0]}
              </Badge>
              <span className="text-xs uppercase tracking-[0.24em] text-slate-500">
                {hero.lane.join(" / ")}
              </span>
            </div>
            <div className="space-y-2">
              <h3 className="font-display text-2xl text-white">{hero.name}</h3>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
                {hero.title}
              </p>
              <p className="max-w-xl text-sm leading-6 text-slate-300">{hero.excerpt}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-slate-300">
            {hero.specialty.slice(0, compact ? 2 : 3).map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </Card>
    </Link>
  );
}


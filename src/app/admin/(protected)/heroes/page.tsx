import Link from "next/link";

import { Card } from "@/components/ui/card";
import { getAllHeroes } from "@/lib/content/repository";

export default async function AdminHeroesPage() {
  const heroes = await getAllHeroes();

  return (
    <div className="grid gap-4">
      {heroes.map((hero) => (
        <Card key={hero.slug} className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-display text-2xl text-white">{hero.name}</p>
            <p className="mt-1 text-sm text-slate-400">
              {hero.role.join(" / ")} · {hero.lane.join(" / ")} · {hero.isSoftFeatured ? "SOFT featured" : "Standard"}
            </p>
          </div>
          <Link href={`/heroes/${hero.slug}`} className="text-sm text-cyan-100 hover:text-cyan-50">
            Open live page
          </Link>
        </Card>
      ))}
    </div>
  );
}


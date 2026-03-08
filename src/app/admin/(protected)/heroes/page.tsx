import { HeroesManager } from "@/components/admin/heroes-manager";
import { Card } from "@/components/ui/card";
import { getAllHeroes, getAllNews, getTaxonomy } from "@/lib/content/repository";

export default async function AdminHeroesPage() {
  const [heroes, news, taxonomy] = await Promise.all([
    getAllHeroes(),
    getAllNews(true),
    getTaxonomy(),
  ]);
  const storyCountByHero = news.reduce<Record<string, number>>((result, story) => {
    result[story.heroSlug] = (result[story.heroSlug] ?? 0) + 1;
    return result;
  }, {});

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <p className="font-display text-3xl text-white">Hero management</p>
        <p className="text-sm leading-6 text-slate-400">
          Edit hero profiles, feature states, taxonomy bindings, and SEO fields from the
          same JSON-first layer that powers public routes.
        </p>
      </Card>
      <HeroesManager
        heroes={heroes}
        tags={taxonomy.tags}
        categories={taxonomy.categories}
        storyCountByHero={storyCountByHero}
      />
    </div>
  );
}

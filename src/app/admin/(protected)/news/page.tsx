import { Card } from "@/components/ui/card";
import { getAllHeroes, getAllNews } from "@/lib/content/repository";

export default async function AdminNewsPage() {
  const [heroes, news] = await Promise.all([getAllHeroes(), getAllNews(true)]);

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <p className="font-display text-3xl text-white">News management</p>
        <p className="text-sm text-slate-400">
          Filter by hero, status and SOFT flag inside the portal UI. Use the quick editor to create or duplicate content.
        </p>
      </Card>
      <div className="grid gap-4">
        {news.map((story) => (
          <Card key={story.slug} className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-display text-2xl text-white">{story.title}</p>
              <p className="mt-1 text-sm text-slate-400">
                {heroes.find((hero) => hero.slug === story.heroSlug)?.name} · {story.status} · {story.isSoft ? "SOFT" : "Standard"}
              </p>
            </div>
            <div className="text-sm text-slate-300">{story.category}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}


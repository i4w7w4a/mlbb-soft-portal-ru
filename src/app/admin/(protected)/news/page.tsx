import { NewsManager } from "@/components/admin/news-manager";
import { Card } from "@/components/ui/card";
import { getAllHeroes, getAllNews } from "@/lib/content/repository";

export default async function AdminNewsPage() {
  const [heroes, news] = await Promise.all([getAllHeroes(), getAllNews(true)]);

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <p className="font-display text-3xl text-white">News management</p>
        <p className="text-sm text-slate-400">
          Operate the full JSON-first queue here: filter by hero, status, or SOFT
          line, duplicate stories into draft variants, and round-trip bulk
          import/export without leaving admin.
        </p>
      </Card>
      <NewsManager heroes={heroes} news={news} />
    </div>
  );
}

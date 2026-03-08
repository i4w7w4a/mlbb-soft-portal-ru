import { NewsFeed } from "@/components/explorers/news-feed";
import { SectionHeading } from "@/components/layout/section-heading";
import {
  getNewsCategoryOptions,
  parseNewsExplorerFilters,
} from "@/lib/explorer-filters";
import { getAllHeroes, getAllNews } from "@/lib/content/repository";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "News",
  description: "Editorial MLBB news feed with filtering across heroes, tags and SOFT.",
  path: "/news",
});

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [heroes, news] = await Promise.all([getAllHeroes(), getAllNews()]);
  const initialFilters = parseNewsExplorerFilters(await searchParams, {
    heroSlugs: heroes.map((hero) => hero.slug),
    categories: getNewsCategoryOptions(news),
  });

  return (
    <div className="mx-auto flex w-[min(100%-1.5rem,88rem)] flex-col gap-10">
      <SectionHeading
        eyebrow="News Stream"
        title="Not a blog list. A structured editorial lane."
        description="Filter by hero, category and SOFT priority without losing hierarchy."
      />
      <NewsFeed news={news} heroes={heroes} initialFilters={initialFilters} />
    </div>
  );
}

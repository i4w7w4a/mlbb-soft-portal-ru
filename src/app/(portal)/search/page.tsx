import { SearchOverview } from "@/components/explorers/search-overview";
import { SectionHeading } from "@/components/layout/section-heading";
import { getAllHeroes, getTaxonomy, searchContent } from "@/lib/content/repository";
import { createSearchMetadata } from "@/lib/seo";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  return createSearchMetadata(q);
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const rawParams = await searchParams;
  const q = Array.isArray(rawParams.q) ? rawParams.q[0] ?? "" : rawParams.q ?? "";
  const [results, heroes, taxonomy] = await Promise.all([
    searchContent(q),
    getAllHeroes(),
    getTaxonomy(),
  ]);

  return (
    <div className="mx-auto flex w-[min(100%-1.5rem,88rem)] flex-col gap-10">
      <SectionHeading
        eyebrow="Global Search"
        title={q ? `Results for "${q}"` : "Search across heroes, stories and tags."}
        description="A fast entry point into the whole content graph."
      />
      <SearchOverview
        query={q}
        heroes={results.heroes}
        news={results.news}
        tags={results.tags}
        catalogHeroes={heroes}
        catalogTags={taxonomy.tags}
      />
    </div>
  );
}

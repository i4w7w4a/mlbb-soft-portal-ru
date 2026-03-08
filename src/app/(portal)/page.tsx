import { HomeHub } from "@/components/home/home-hub";
import { getAllHeroes, getAllNews, getPortalSnapshot } from "@/lib/content/repository";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Home",
  description:
    "Spectacular MLBB editorial homepage with SOFT as the central content switch.",
  path: "/",
});

export default async function HomePage() {
  const [snapshot, latestNews, heroes] = await Promise.all([
    getPortalSnapshot(),
    getAllNews(),
    getAllHeroes(),
  ]);

  return <HomeHub snapshot={snapshot} latestNews={latestNews} heroes={heroes} />;
}

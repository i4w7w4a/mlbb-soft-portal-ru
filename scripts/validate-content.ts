import { getAllHeroes, getAllNews, getTaxonomy } from "@/lib/content/repository";

async function main() {
  const [heroes, news, taxonomy] = await Promise.all([
    getAllHeroes(),
    getAllNews(true),
    getTaxonomy(),
  ]);

  console.log(
    JSON.stringify(
      {
        heroes: heroes.length,
        news: news.length,
        tags: taxonomy.tags.length,
        categories: taxonomy.categories.length,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


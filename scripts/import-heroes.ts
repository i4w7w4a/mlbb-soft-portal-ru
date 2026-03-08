import { promises as fs } from "fs";
import path from "path";

import { loadHeroSeedsWithFallback } from "@/lib/content/import-heroes";

async function main() {
  const heroes = await loadHeroSeedsWithFallback();
  const contentRoot = path.join(process.cwd(), "content", "heroes");

  for (const hero of heroes) {
    const heroDirectory = path.join(contentRoot, hero.slug);
    await fs.mkdir(path.join(heroDirectory, "news"), { recursive: true });
    await fs.writeFile(
      path.join(heroDirectory, "hero.json"),
      `${JSON.stringify(hero, null, 2)}\n`,
      "utf8",
    );
  }

  await fs.writeFile(
    path.join(contentRoot, "index.json"),
    `${JSON.stringify({ heroes: heroes.map((hero) => hero.slug) }, null, 2)}\n`,
    "utf8",
  );

  console.log(`Imported ${heroes.length} heroes.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

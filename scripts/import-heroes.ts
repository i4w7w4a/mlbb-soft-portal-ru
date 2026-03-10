import { promises as fs } from "fs";
import path from "path";

import { loadHeroSeedsWithFallback } from "@/lib/content/import-heroes";
import { getContentRoot } from "@/lib/content/paths";

async function main() {
  const report = await loadHeroSeedsWithFallback();
  const heroes = report.heroes;
  const contentRoot = path.join(getContentRoot(), "heroes");

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

  console.log(`Imported ${heroes.length} heroes from ${report.source}.`);

  if (report.snapshotPaths.length) {
    console.log(`Saved remote snapshots:\n- ${report.snapshotPaths.join("\n- ")}`);
  }

  if (report.diagnostics.length) {
    const groupedDiagnostics = report.diagnostics.reduce<Record<string, number>>((acc, diagnostic) => {
      const key = `${diagnostic.level}:${diagnostic.code}`;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    console.log("Diagnostics summary:");

    for (const [key, count] of Object.entries(groupedDiagnostics).sort((left, right) =>
      left[0].localeCompare(right[0]),
    )) {
      console.log(`- ${key} x${count}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

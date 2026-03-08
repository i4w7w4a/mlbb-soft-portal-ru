import * as cheerio from "cheerio";
import { promises as fs } from "fs";
import path from "path";

import { heroSchema, type Hero } from "@/lib/content/schemas";
import { slugify, titleCase } from "@/lib/utils";

type RawHeroSeed = {
  slug: string;
  name: string;
  title: string;
  role: string[];
  lane: string[];
};

const rawSeedPath = path.join(
  process.cwd(),
  "content",
  "heroes",
  "raw",
  "mlbb-gg-heroes.json",
);

async function readFallbackSeed() {
  const raw = await fs.readFile(rawSeedPath, "utf8");
  return JSON.parse(raw) as RawHeroSeed[];
}

function normalizeImportedHero(hero: RawHeroSeed): Hero {
  const slug = slugify(hero.slug || hero.name);

  return heroSchema.parse({
    id: slug,
    slug,
    name: hero.name,
    title: hero.title,
    role: hero.role,
    lane: hero.lane,
    specialty: ["Burst"],
    excerpt: `${hero.name} enters the portal as an imported hero seed ready for editorial coverage.`,
    avatar: `/images/heroes/${slug}/avatar.svg`,
    cover: `/images/heroes/${slug}/cover.svg`,
    isFeatured: false,
    isSoftFeatured: false,
    tags: [...hero.role, ...hero.lane].map(slugify),
    difficulty: "Medium",
    releaseYear: 2026,
    accent: "#6be8ff",
    seo: {
      title: `${hero.name} MLBB News, Guides and Updates`,
      description: `Imported seed content for ${hero.name}.`,
    },
  });
}

export async function fetchRemoteHeroSeeds() {
  const response = await fetch("https://mlbb.gg/heroes", {
    headers: {
      "user-agent": "mlbb-soft-portal-importer",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch mlbb.gg heroes: ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const heroCards = new Map<string, RawHeroSeed>();

  $("a[href*='/heroes/']").each((_, element) => {
    const href = $(element).attr("href") ?? "";
    const slugMatch = href.match(/\/heroes\/([^/?#]+)/);
    const slug = slugMatch?.[1];

    if (!slug) {
      return;
    }

    const name =
      $(element).find("[class*='title'], [class*='name']").first().text().trim() ||
      titleCase(slug);

    heroCards.set(slug, {
      slug,
      name,
      title:
        $(element).find("[class*='subtitle']").first().text().trim() || "Imported Hero",
      role: ["Fighter"],
      lane: ["Mid"],
    });
  });

  if (!heroCards.size) {
    throw new Error("Remote hero page did not expose parseable hero cards.");
  }

  return [...heroCards.values()];
}

export async function loadHeroSeedsWithFallback() {
  try {
    const remote = await fetchRemoteHeroSeeds();
    return remote.map(normalizeImportedHero);
  } catch {
    const fallback = await readFallbackSeed();
    return fallback.map(normalizeImportedHero);
  }
}

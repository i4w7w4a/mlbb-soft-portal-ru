import * as cheerio from "cheerio";
import { promises as fs } from "fs";
import path from "path";

import { heroSchema, type Hero } from "@/lib/content/schemas";
import { slugify, titleCase, unique } from "@/lib/utils";

const REMOTE_HEROES_URL = "https://mlbb.gg/heroes";
const REMOTE_ORIGIN = "https://mlbb.gg";
const DEFAULT_RANK_FILTER = "Mythical Glory Plus";
const DEFAULT_RELEASE_YEAR = 2026;
const DEFAULT_USER_AGENT = "mlbb-soft-portal-importer/1.0";

const rawDirectoryPath = path.join(
  process.cwd(),
  "content",
  "heroes",
  "raw",
);

const fallbackSeedPath = path.join(rawDirectoryPath, "mlbb-gg-heroes.json");
const remoteHtmlSnapshotPath = path.join(rawDirectoryPath, "mlbb-gg-heroes.remote.html");
const remoteJsonSnapshotPath = path.join(rawDirectoryPath, "mlbb-gg-heroes.remote.json");

type FetchLike = typeof fetch;
type DiagnosticLevel = "info" | "warn" | "error";

type FallbackHeroSeed = {
  slug?: string;
  name: string;
  title?: string;
  role?: string[];
  lane?: string[];
  specialty?: string[];
  releaseYear?: number;
  accent?: string;
};

type RemoteHeroListEntry = {
  slug: string;
  name: string;
  remotePath: string;
  remoteUrl: string;
  rankFilter: string;
  avatarUrl?: string;
};

type StructuredDataProperty = {
  name?: string;
  value?: string;
};

type StructuredHeroData = {
  "@type"?: string;
  name?: string;
  description?: string;
  image?: string;
  mainEntity?: {
    additionalProperty?: StructuredDataProperty[];
  };
};

export type RawHeroSeed = {
  slug: string;
  name: string;
  title?: string;
  role: string[];
  lane: string[];
  specialty: string[];
  description?: string;
  remotePath?: string;
  remoteUrl?: string;
  rankFilter?: string;
  avatarUrl?: string;
  backgroundUrl?: string;
  accent?: string;
  structuredData?: StructuredHeroData;
};

export type HeroImportDiagnostic = {
  level: DiagnosticLevel;
  code: string;
  message: string;
  heroSlug?: string;
  remotePath?: string;
};

export type HeroImportReport = {
  source: "remote" | "fallback";
  heroes: Hero[];
  diagnostics: HeroImportDiagnostic[];
  snapshotPaths: string[];
};

type NormalizeHeroResult = {
  hero: Hero;
  diagnostics: HeroImportDiagnostic[];
};

type FetchRemoteResult = {
  heroes: RawHeroSeed[];
  diagnostics: HeroImportDiagnostic[];
  listHtml: string;
};

const roleAccentMap: Record<string, string> = {
  Assassin: "#65e6ff",
  Fighter: "#ff7b6b",
  Mage: "#8b7dff",
  Marksman: "#f7b955",
  Support: "#7ee7d3",
  Tank: "#41d3a2",
};

function normalizeWhitespace(value?: string | null) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function withArticle(value: string) {
  return /^[aeiou]/i.test(value) ? `an ${value}` : `a ${value}`;
}

function splitCompositeValues(value?: string | null) {
  return normalizeWhitespace(value)
    .split(/[\/,|•·]+/g)
    .map((token) => normalizeWhitespace(token))
    .filter(Boolean);
}

function normalizeRoleLabel(value?: string | null) {
  const normalized = normalizeWhitespace(value).toLowerCase();

  if (!normalized) {
    return null;
  }

  if (normalized.includes("assassin")) {
    return "Assassin";
  }
  if (normalized.includes("marksman")) {
    return "Marksman";
  }
  if (normalized.includes("fighter")) {
    return "Fighter";
  }
  if (normalized.includes("support")) {
    return "Support";
  }
  if (normalized.includes("tank")) {
    return "Tank";
  }
  if (normalized.includes("mage")) {
    return "Mage";
  }

  return null;
}

export function normalizeLaneLabel(value?: string | null) {
  const normalized = normalizeWhitespace(value)
    .toLowerCase()
    .replace(/\blane\b/g, "")
    .trim();

  if (!normalized) {
    return null;
  }

  if (normalized.includes("jung")) {
    return "Jungle";
  }
  if (normalized.includes("gold")) {
    return "Gold";
  }
  if (normalized === "exp" || normalized.includes("exp")) {
    return "EXP";
  }
  if (normalized.includes("roam")) {
    return "Roam";
  }
  if (normalized.includes("mid")) {
    return "Mid";
  }

  return null;
}

function normalizeSpecialtyLabel(value?: string | null) {
  const normalized = normalizeWhitespace(value);

  if (!normalized) {
    return null;
  }

  return titleCase(normalized.toLowerCase());
}

function extractHexColor(value?: string | null) {
  return value?.match(/#(?:[0-9a-f]{6}|[0-9a-f]{3})/i)?.[0];
}

function unwrapNextImageUrl(value?: string | null) {
  const normalized = normalizeWhitespace(value);

  if (!normalized) {
    return undefined;
  }

  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    return normalized;
  }

  if (normalized.startsWith("/_next/image")) {
    const url = new URL(normalized, REMOTE_ORIGIN);
    const source = url.searchParams.get("url");
    return source ? decodeURIComponent(source) : undefined;
  }

  if (normalized.startsWith("/")) {
    return new URL(normalized, REMOTE_ORIGIN).href;
  }

  return normalized;
}

function extractFirstImageCandidate(value?: string | null) {
  const normalized = normalizeWhitespace(value);

  if (!normalized) {
    return undefined;
  }

  const first = normalized.split(",")[0]?.trim().split(/\s+/)[0];
  return unwrapNextImageUrl(first);
}

function extractBackgroundUrl(style?: string | null) {
  const match = style?.match(/url\(([^)]+)\)/i)?.[1];
  return unwrapNextImageUrl(match?.replace(/^['"]|['"]$/g, ""));
}

function buildRemoteHeroUrl(remotePath: string, rankFilter = DEFAULT_RANK_FILTER) {
  const url = new URL(remotePath, REMOTE_ORIGIN);
  url.searchParams.set("rank_filter", rankFilter);
  return url.href;
}

function parseHeroHref(href?: string | null) {
  if (!href) {
    return null;
  }

  const url = new URL(href, REMOTE_ORIGIN);

  if (!/^\/heroes\/\d+$/.test(url.pathname)) {
    return null;
  }

  const rankFilter = url.searchParams.get("rank_filter") || DEFAULT_RANK_FILTER;

  return {
    remotePath: url.pathname,
    remoteUrl: buildRemoteHeroUrl(url.pathname, rankFilter),
    rankFilter,
  };
}

function parseStructuredHeroData(html: string) {
  const $ = cheerio.load(html);
  const scripts = $("script[type='application/ld+json']")
    .map((_, element) => $(element).text())
    .get();

  for (const script of scripts) {
    const text = normalizeWhitespace(script);

    if (!text) {
      continue;
    }

    try {
      const parsed = JSON.parse(text) as StructuredHeroData | StructuredHeroData[];
      const candidates = Array.isArray(parsed) ? parsed : [parsed];
      const heroData = candidates.find((candidate) => candidate["@type"] === "VideoGame");

      if (heroData) {
        return heroData;
      }
    } catch {
      continue;
    }
  }

  return undefined;
}

function extractStructuredPropertyValue(
  structuredData: StructuredHeroData | undefined,
  propertyName: string,
) {
  return structuredData?.mainEntity?.additionalProperty?.find(
    (property) => normalizeWhitespace(property.name).toLowerCase() === propertyName.toLowerCase(),
  )?.value;
}

export function extractRemoteHeroLinks(html: string) {
  const $ = cheerio.load(html);
  const heroCards = new Map<string, RemoteHeroListEntry>();

  $("a[href*='/heroes/']").each((_, element) => {
    const hrefData = parseHeroHref($(element).attr("href"));

    if (!hrefData) {
      return;
    }

    const name =
      normalizeWhitespace($(element).find("h3").first().text()) ||
      normalizeWhitespace($(element).find("img").attr("alt")) ||
      normalizeWhitespace($(element).text());

    if (!name) {
      return;
    }

    const slug = slugify(name);

    const image = $(element).find("img").first();

    heroCards.set(slug, {
      slug,
      name,
      remotePath: hrefData.remotePath,
      remoteUrl: hrefData.remoteUrl,
      rankFilter: hrefData.rankFilter,
      avatarUrl: extractFirstImageCandidate(image.attr("srcset")) || unwrapNextImageUrl(image.attr("src")),
    });
  });

  return [...heroCards.values()];
}

export function extractRemoteHeroDetail(html: string) {
  const $ = cheerio.load(html);
  const structuredData = parseStructuredHeroData(html);
  const header = $("h1").first().closest("header");
  const portrait = header.find("img[alt*='hero portrait']").first();
  const portraitAlt = normalizeWhitespace(portrait.attr("alt"));
  const description = normalizeWhitespace(structuredData?.description);
  const headerTail = header.find("span").last().text();

  const roleFromDescription =
    description.match(/\bis an?\s+(.+?)\s+hero\b/i)?.[1] ||
    description.match(/\bis\s+(.+?)\s+hero\b/i)?.[1];

  const specialtyFromDescription = description.match(/\bspecializing in\s+(.+?)(?:\.|$)/i)?.[1];
  const roleFromPortrait = portraitAlt.match(/hero portrait - (.+?) in /i)?.[1];
  const laneFromPortrait = portraitAlt.match(/ in (.+)$/i)?.[1];
  const laneFromStructuredData = extractStructuredPropertyValue(structuredData, "Main Lane");
  const accent =
    extractHexColor(header.find("[style*='border-color']").first().attr("style")) ||
    extractHexColor(header.attr("style"));
  const backgroundUrl = extractBackgroundUrl(
    header.parents().filter((_, element) => {
      const style = $(element).attr("style");
      return style?.includes("background-image") ?? false;
    }).first().attr("style"),
  );

  return {
    name:
      normalizeWhitespace($("h1").first().text()) ||
      normalizeWhitespace(structuredData?.name).replace(/ - Mobile Legends: Bang Bang$/i, ""),
    role: unique(
      [roleFromDescription, roleFromPortrait]
        .flatMap((value) => splitCompositeValues(value))
        .map((value) => normalizeRoleLabel(value))
        .filter((value): value is NonNullable<typeof value> => Boolean(value)),
    ),
    lane: unique(
      [laneFromStructuredData, laneFromPortrait]
        .flatMap((value) => splitCompositeValues(value))
        .map((value) => normalizeLaneLabel(value))
        .filter((value): value is NonNullable<typeof value> => Boolean(value)),
    ),
    specialty: unique(
      [specialtyFromDescription, headerTail]
        .flatMap((value) => splitCompositeValues(value))
        .map((value) => normalizeSpecialtyLabel(value))
        .filter((value): value is NonNullable<typeof value> => Boolean(value)),
    ),
    description,
    avatarUrl:
      extractFirstImageCandidate(portrait.attr("srcset")) ||
      unwrapNextImageUrl(portrait.attr("src")) ||
      unwrapNextImageUrl(structuredData?.image),
    backgroundUrl,
    accent,
    structuredData,
  };
}

async function mapConcurrently<T, U>(
  values: T[],
  concurrency: number,
  iteratee: (value: T, index: number) => Promise<U>,
) {
  const results = new Array<U>(values.length);
  let cursor = 0;

  await Promise.all(
    Array.from({ length: Math.min(concurrency, values.length) }, async () => {
      while (cursor < values.length) {
        const index = cursor;
        cursor += 1;
        results[index] = await iteratee(values[index] as T, index);
      }
    }),
  );

  return results;
}

async function readFallbackSeed() {
  const raw = await fs.readFile(fallbackSeedPath, "utf8");
  const parsed = JSON.parse(raw) as FallbackHeroSeed[];

  return parsed.map((hero) => ({
    slug: slugify(hero.slug || hero.name),
    name: hero.name,
    title: hero.title,
    role: hero.role ?? [],
    lane: hero.lane ?? [],
    specialty: hero.specialty ?? [],
    accent: hero.accent,
  }));
}

function defaultSpecialtyForRole(role: Hero["role"][number]) {
  switch (role) {
    case "Assassin":
      return "Burst";
    case "Fighter":
      return "Damage";
    case "Mage":
      return "Poke";
    case "Marksman":
      return "Finisher";
    case "Support":
      return "Utility";
    case "Tank":
      return "Initiation";
    default:
      return "Control";
  }
}

function defaultAccentForRole(role: Hero["role"][number]) {
  return roleAccentMap[role] ?? "#6be8ff";
}

function inferDifficulty(role: Hero["role"][number][], specialty: string[]) {
  const specialtySet = new Set(specialty.map((value) => value.toLowerCase()));

  if (
    role.includes("Assassin") ||
    specialtySet.has("burst") ||
    specialtySet.has("chase") ||
    specialtySet.has("finisher")
  ) {
    return "High" as const;
  }

  if (
    role.includes("Tank") ||
    role.includes("Support") ||
    specialtySet.has("utility") ||
    specialtySet.has("control")
  ) {
    return "Low" as const;
  }

  return "Medium" as const;
}

function buildExcerpt(hero: {
  name: string;
  role: Hero["role"][number][];
  lane: Hero["lane"][number][];
  specialty: string[];
  description?: string;
}) {
  if (hero.description) {
    return hero.description.replace(/\s*Currently in .+$/i, "");
  }

  const roleText = hero.role.join(" / ").toLowerCase();
  const laneText = hero.lane.join(" / ").toLowerCase();
  const specialtyText = hero.specialty.join(", ").toLowerCase();

  return `${hero.name} pressures ${laneText} as ${withArticle(roleText)} built around ${specialtyText}.`;
}

function buildGeneratedTitle(hero: {
  name: string;
  role: Hero["role"][number][];
}) {
  const leadRole = hero.role.join(" / ");
  return leadRole ? `${leadRole} Specialist` : `${hero.name} Hero Profile`;
}

export function normalizeImportedHero(
  importedHero: RawHeroSeed,
  fallbackHero?: RawHeroSeed,
) {
  const diagnostics: HeroImportDiagnostic[] = [];
  const slug = slugify(importedHero.slug || importedHero.name || fallbackHero?.name || "hero");
  const name = importedHero.name || fallbackHero?.name || titleCase(slug);
  const role = unique(
    [...(importedHero.role ?? []), ...(fallbackHero?.role ?? [])]
      .map((value) => normalizeRoleLabel(value))
      .filter((value): value is NonNullable<typeof value> => Boolean(value)),
  );
  const lane = unique(
    [...(importedHero.lane ?? []), ...(fallbackHero?.lane ?? [])]
      .map((value) => normalizeLaneLabel(value))
      .filter((value): value is NonNullable<typeof value> => Boolean(value)),
  );
  const specialty = unique(
    [...(importedHero.specialty ?? []), ...(fallbackHero?.specialty ?? [])]
      .map((value) => normalizeSpecialtyLabel(value))
      .filter((value): value is NonNullable<typeof value> => Boolean(value)),
  );

  const normalizedRole = role.length ? role : ["Fighter"];
  const normalizedLane = lane.length ? lane : ["Mid"];
  const normalizedSpecialty = specialty.length
    ? specialty
    : [defaultSpecialtyForRole(normalizedRole[0] as Hero["role"][number])];

  if (!role.length) {
    diagnostics.push({
      level: "warn",
      code: "role_missing",
      message: "Remote payload did not expose a hero role. Falling back to Fighter.",
      heroSlug: slug,
      remotePath: importedHero.remotePath,
    });
  }

  if (!lane.length) {
    diagnostics.push({
      level: "warn",
      code: "lane_missing",
      message: "Remote payload did not expose a lane. Falling back to Mid.",
      heroSlug: slug,
      remotePath: importedHero.remotePath,
    });
  }

  if (!specialty.length) {
    diagnostics.push({
      level: "warn",
      code: "specialty_missing",
      message: `Remote payload did not expose a specialty. Falling back to ${normalizedSpecialty[0]}.`,
      heroSlug: slug,
      remotePath: importedHero.remotePath,
    });
  }

  const title = normalizeWhitespace(importedHero.title) || normalizeWhitespace(fallbackHero?.title);

  if (!title) {
    diagnostics.push({
      level: "info",
      code: "title_missing",
      message:
        "mlbb.gg does not expose the official lore title for this hero. Using a generated title until editorial enrichment lands.",
      heroSlug: slug,
      remotePath: importedHero.remotePath,
    });
  }

  const accent =
    extractHexColor(importedHero.accent) ||
    extractHexColor(fallbackHero?.accent) ||
    defaultAccentForRole(normalizedRole[0] as Hero["role"][number]);

  const hero = heroSchema.parse({
    id: slug,
    slug,
    name,
    title: title || buildGeneratedTitle({ name, role: normalizedRole as Hero["role"][number][] }),
    role: normalizedRole,
    lane: normalizedLane,
    specialty: normalizedSpecialty,
    excerpt: buildExcerpt({
      name,
      role: normalizedRole as Hero["role"][number][],
      lane: normalizedLane as Hero["lane"][number][],
      specialty: normalizedSpecialty,
      description: importedHero.description,
    }),
    avatar: `/images/heroes/${slug}/avatar.svg`,
    cover: `/images/heroes/${slug}/cover.svg`,
    isFeatured: false,
    isSoftFeatured: false,
    tags: [...normalizedRole, ...normalizedLane, ...normalizedSpecialty].map(slugify),
    difficulty: inferDifficulty(
      normalizedRole as Hero["role"][number][],
      normalizedSpecialty,
    ),
    releaseYear: DEFAULT_RELEASE_YEAR,
    accent,
    seo: {
      title: `${name} MLBB News, Guides and Updates`,
      description: buildExcerpt({
        name,
        role: normalizedRole as Hero["role"][number][],
        lane: normalizedLane as Hero["lane"][number][],
        specialty: normalizedSpecialty,
        description: importedHero.description,
      }),
    },
  });

  return {
    hero,
    diagnostics,
  } satisfies NormalizeHeroResult;
}

async function writeRemoteSnapshots(options: {
  heroes: RawHeroSeed[];
  diagnostics: HeroImportDiagnostic[];
  listHtml: string;
}) {
  await fs.mkdir(rawDirectoryPath, { recursive: true });
  await fs.writeFile(remoteHtmlSnapshotPath, options.listHtml, "utf8");
  await fs.writeFile(
    remoteJsonSnapshotPath,
    `${JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        sourceUrl: REMOTE_HEROES_URL,
        heroCount: options.heroes.length,
        diagnostics: options.diagnostics,
        heroes: options.heroes,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  return [remoteHtmlSnapshotPath, remoteJsonSnapshotPath];
}

export async function fetchRemoteHeroSeeds(options?: {
  concurrency?: number;
  fetchImpl?: FetchLike;
}) {
  const fetchImpl = options?.fetchImpl ?? fetch;
  const response = await fetchImpl(REMOTE_HEROES_URL, {
    headers: {
      "user-agent": DEFAULT_USER_AGENT,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch mlbb.gg heroes: ${response.status}`);
  }

  const listHtml = await response.text();
  const heroLinks = extractRemoteHeroLinks(listHtml);

  if (!heroLinks.length) {
    throw new Error("Remote hero page did not expose parseable hero cards.");
  }

  const diagnostics: HeroImportDiagnostic[] = [];
  const heroes = await mapConcurrently(
    heroLinks,
    options?.concurrency ?? 6,
    async (heroLink) => {
      try {
        const detailResponse = await fetchImpl(heroLink.remoteUrl, {
          headers: {
            "user-agent": DEFAULT_USER_AGENT,
          },
        });

        if (!detailResponse.ok) {
          throw new Error(`Hero detail request failed with status ${detailResponse.status}`);
        }

        const detailHtml = await detailResponse.text();
        const detail = extractRemoteHeroDetail(detailHtml);

        if (!detail.name) {
          diagnostics.push({
            level: "warn",
            code: "detail_name_missing",
            message: "Hero detail payload did not expose a heading. Falling back to list-page name.",
            heroSlug: heroLink.slug,
            remotePath: heroLink.remotePath,
          });
        }

        return {
          slug: heroLink.slug,
          name: detail.name || heroLink.name,
          role: detail.role,
          lane: detail.lane,
          specialty: detail.specialty,
          description: detail.description,
          remotePath: heroLink.remotePath,
          remoteUrl: heroLink.remoteUrl,
          rankFilter: heroLink.rankFilter,
          avatarUrl: detail.avatarUrl || heroLink.avatarUrl,
          backgroundUrl: detail.backgroundUrl,
          accent: detail.accent,
          structuredData: detail.structuredData,
        } satisfies RawHeroSeed;
      } catch (error) {
        diagnostics.push({
          level: "warn",
          code: "detail_fetch_failed",
          message:
            error instanceof Error ? error.message : "Unknown hero detail fetch failure.",
          heroSlug: heroLink.slug,
          remotePath: heroLink.remotePath,
        });

        return {
          slug: heroLink.slug,
          name: heroLink.name,
          role: [],
          lane: [],
          specialty: [],
          remotePath: heroLink.remotePath,
          remoteUrl: heroLink.remoteUrl,
          rankFilter: heroLink.rankFilter,
          avatarUrl: heroLink.avatarUrl,
        } satisfies RawHeroSeed;
      }
    },
  );

  return {
    heroes,
    diagnostics,
    listHtml,
  } satisfies FetchRemoteResult;
}

export async function loadHeroSeedsWithFallback(options?: {
  concurrency?: number;
  fetchImpl?: FetchLike;
  writeSnapshots?: boolean;
}) {
  const fallbackHeroes = await readFallbackSeed();
  const fallbackMap = new Map(fallbackHeroes.map((hero) => [hero.slug, hero]));
  const diagnostics: HeroImportDiagnostic[] = [];
  const snapshotPaths: string[] = [];

  try {
    const remote = await fetchRemoteHeroSeeds({
      concurrency: options?.concurrency,
      fetchImpl: options?.fetchImpl,
    });

    diagnostics.push(...remote.diagnostics);

    if (options?.writeSnapshots !== false) {
      snapshotPaths.push(
        ...(await writeRemoteSnapshots({
          heroes: remote.heroes,
          diagnostics: remote.diagnostics,
          listHtml: remote.listHtml,
        })),
      );
    }

    const heroes = remote.heroes
      .map((hero) => {
        try {
          const normalized = normalizeImportedHero(hero, fallbackMap.get(hero.slug));
          diagnostics.push(...normalized.diagnostics);
          return normalized.hero;
        } catch (error) {
          diagnostics.push({
            level: "error",
            code: "hero_normalization_failed",
            message:
              error instanceof Error ? error.message : "Unknown hero normalization failure.",
            heroSlug: hero.slug,
            remotePath: hero.remotePath,
          });

          return null;
        }
      })
      .filter((hero): hero is Hero => Boolean(hero));

    if (!heroes.length) {
      throw new Error("Remote import produced zero valid heroes.");
    }

    return {
      source: "remote",
      heroes,
      diagnostics,
      snapshotPaths,
    } satisfies HeroImportReport;
  } catch (error) {
    diagnostics.push({
      level: "warn",
      code: "remote_import_failed",
      message:
        error instanceof Error
          ? `${error.message}. Falling back to local raw seed.`
          : "Unknown remote import failure. Falling back to local raw seed.",
    });

    const heroes = fallbackHeroes.map((hero) => normalizeImportedHero(hero).hero);

    return {
      source: "fallback",
      heroes,
      diagnostics,
      snapshotPaths,
    } satisfies HeroImportReport;
  }
}

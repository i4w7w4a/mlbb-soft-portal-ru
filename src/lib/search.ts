import type { Hero, News, TaxonomyTag } from "@/lib/content/schemas";

const tagKindPriority: Record<TaxonomyTag["kind"], number> = {
  product: 0,
  topic: 1,
  role: 2,
  lane: 3,
};

function normalizeSearchQuery(query: string) {
  return query.trim().toLowerCase();
}

function getQueryTokens(query: string) {
  return normalizeSearchQuery(query).split(/\s+/).filter(Boolean);
}

function scoreText(value: string, normalizedQuery: string, tokens: string[]) {
  if (!value || !normalizedQuery) {
    return 0;
  }

  const normalizedValue = value.toLowerCase();
  let score = 0;

  if (normalizedValue === normalizedQuery) score += 28;
  else if (normalizedValue.startsWith(normalizedQuery)) score += 18;
  else if (normalizedValue.includes(normalizedQuery)) score += 10;

  tokens.forEach((token) => {
    if (normalizedValue === token) score += 14;
    else if (normalizedValue.startsWith(token)) score += 8;
    else if (normalizedValue.includes(token)) score += 4;
  });

  return score;
}

function scoreWeightedFields(
  fields: Array<{ value: string; weight: number }>,
  normalizedQuery: string,
  tokens: string[],
) {
  return fields.reduce(
    (result, field) => result + scoreText(field.value, normalizedQuery, tokens) * field.weight,
    0,
  );
}

function rankItems<T>(
  items: T[],
  options: {
    score: (item: T) => number;
    sort?: (left: T, right: T) => number;
  },
) {
  return items
    .map((item) => ({ item, score: options.score(item) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return options.sort ? options.sort(left.item, right.item) : 0;
    })
    .map((entry) => entry.item);
}

export function rankSearchContent({
  query,
  heroes,
  news,
  tags,
}: {
  query: string;
  heroes: Hero[];
  news: News[];
  tags: TaxonomyTag[];
}) {
  const normalizedQuery = normalizeSearchQuery(query);
  const tokens = getQueryTokens(query);

  if (!normalizedQuery) {
    return {
      query: normalizedQuery,
      heroes: [...heroes]
        .sort((left, right) => {
          return (
            Number(right.isSoftFeatured) - Number(left.isSoftFeatured) ||
            Number(right.isFeatured) - Number(left.isFeatured) ||
            right.releaseYear - left.releaseYear ||
            left.name.localeCompare(right.name)
          );
        })
        .slice(0, 6),
      news: [...news]
        .sort((left, right) => {
          return (
            Number(right.isSoft) - Number(left.isSoft) ||
            Number(right.isFeatured) - Number(left.isFeatured) ||
            new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime()
          );
        })
        .slice(0, 8),
      tags: [...tags]
        .sort((left, right) => {
          return (
            tagKindPriority[left.kind] - tagKindPriority[right.kind] ||
            left.label.localeCompare(right.label)
          );
        })
        .slice(0, 8),
    };
  }

  const rankedHeroes = rankItems(heroes, {
    score: (hero) =>
      scoreWeightedFields(
        [
          { value: hero.name, weight: 4 },
          { value: hero.slug, weight: 4 },
          { value: hero.title, weight: 2.5 },
          { value: hero.excerpt, weight: 1.2 },
          { value: hero.tags.join(" "), weight: 2 },
          { value: hero.role.join(" "), weight: 1.6 },
          { value: hero.lane.join(" "), weight: 1.6 },
          { value: hero.specialty.join(" "), weight: 1.4 },
        ],
        normalizedQuery,
        tokens,
      ) +
      (hero.isSoftFeatured && normalizedQuery.includes("soft") ? 14 : 0) +
      (hero.isFeatured ? 1.5 : 0),
    sort: (left, right) => left.name.localeCompare(right.name),
  });

  const rankedNews = rankItems(news, {
    score: (story) =>
      scoreWeightedFields(
        [
          { value: story.title, weight: 4 },
          { value: story.slug, weight: 3.4 },
          { value: story.excerpt, weight: 1.6 },
          { value: story.tags.join(" "), weight: 2.2 },
          { value: story.category, weight: 1.8 },
          { value: story.heroSlug, weight: 2.2 },
        ],
        normalizedQuery,
        tokens,
      ) +
      (story.isSoft && normalizedQuery.includes("soft") ? 16 : 0) +
      (story.isSoft ? 2.5 : 0) +
      (story.isFeatured ? 2 : 0),
    sort: (left, right) =>
      new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime(),
  });

  const rankedTags = rankItems(tags, {
    score: (tag) =>
      scoreWeightedFields(
        [
          { value: tag.label, weight: 4 },
          { value: tag.slug, weight: 4 },
          { value: tag.kind, weight: 1.4 },
        ],
        normalizedQuery,
        tokens,
      ) +
      (tag.kind === "product" && normalizedQuery.includes("soft") ? 18 : 0),
    sort: (left, right) => {
      return (
        tagKindPriority[left.kind] - tagKindPriority[right.kind] ||
        left.label.localeCompare(right.label)
      );
    },
  });

  return {
    query: normalizedQuery,
    heroes: rankedHeroes,
    news: rankedNews,
    tags: rankedTags,
  };
}

export function createSearchSuggestions({
  heroes,
  tags,
}: {
  heroes: Hero[];
  tags: TaxonomyTag[];
}) {
  const heroSuggestions = heroes
    .filter((hero) => hero.isFeatured || hero.isSoftFeatured)
    .slice(0, 3)
    .map((hero) => hero.name);
  const tagSuggestions = tags
    .filter((tag) => tag.kind === "product" || tag.kind === "topic")
    .slice(0, 5)
    .map((tag) => tag.label);

  return [...new Set([...heroSuggestions, ...tagSuggestions])].slice(0, 6);
}

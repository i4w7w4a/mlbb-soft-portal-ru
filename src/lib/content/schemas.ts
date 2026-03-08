import { z } from "zod";

import { slugify, unique } from "@/lib/utils";

const heroRoleValues = [
  "Assassin",
  "Mage",
  "Tank",
  "Marksman",
  "Fighter",
  "Support",
] as const;

const laneValues = ["Jungle", "Mid", "Gold", "EXP", "Roam"] as const;
const newsStatusValues = ["draft", "published"] as const;

const normalizedString = z.string().trim().min(1);

const normalizedSlug = normalizedString.transform((value) => slugify(value));

const isoDate = normalizedString.transform((value, ctx) => {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Invalid date value: ${value}`,
    });
    return z.NEVER;
  }

  return parsed.toISOString();
});

const seoSchema = z.object({
  title: normalizedString,
  description: normalizedString,
});

export const heroSchema = z
  .object({
    id: normalizedSlug,
    slug: normalizedSlug,
    name: normalizedString,
    title: normalizedString,
    role: z.array(z.enum(heroRoleValues)).min(1),
    lane: z.array(z.enum(laneValues)).min(1),
    specialty: z.array(normalizedString).min(1).transform(unique),
    excerpt: normalizedString,
    avatar: normalizedString,
    cover: normalizedString,
    isFeatured: z.boolean().default(false),
    isSoftFeatured: z.boolean().default(false),
    tags: z.array(normalizedSlug).default([]).transform(unique),
    faction: normalizedString.optional(),
    signature: normalizedString.optional(),
    difficulty: z.enum(["Low", "Medium", "High"]).default("Medium"),
    releaseYear: z.number().int().min(2016).max(2030),
    accent: normalizedString,
    seo: seoSchema,
  })
  .superRefine((hero, ctx) => {
    if (hero.id !== hero.slug) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["id"],
        message: "Hero id must normalize to the same value as slug.",
      });
    }
  });

export const newsSchema = z.object({
  id: normalizedSlug,
  slug: normalizedSlug,
  title: normalizedString,
  excerpt: normalizedString,
  heroSlug: normalizedSlug,
  cover: normalizedString,
  status: z.enum(newsStatusValues),
  isSoft: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  category: normalizedSlug,
  tags: z.array(normalizedSlug).default([]).transform(unique),
  author: normalizedString,
  publishedAt: isoDate,
  readingTime: z.number().int().min(1).max(60),
  seo: seoSchema,
  contentMarkdown: normalizedString,
});

export const taxonomyTagSchema = z.object({
  slug: normalizedSlug,
  label: normalizedString,
  kind: z.enum(["role", "lane", "topic", "product"]),
});

export const taxonomyCategorySchema = z.object({
  slug: normalizedSlug,
  label: normalizedString,
});

export const latestIndexSchema = z.object({
  featured: z.array(normalizedSlug).default([]),
  trending: z.array(normalizedSlug).default([]),
  spotlight: z.array(normalizedSlug).default([]),
  collections: z
    .array(
      z.object({
        slug: normalizedSlug,
        title: normalizedString,
        excerpt: normalizedString,
        newsIds: z.array(normalizedSlug).min(1),
      }),
    )
    .default([]),
});

export const siteSettingsSchema = z.object({
  siteName: normalizedString,
  siteTagline: normalizedString,
  siteDescription: normalizedString,
  defaultOgImage: normalizedString,
  primaryNav: z.array(
    z.object({
      label: normalizedString,
      href: normalizedString,
    }),
  ),
});

export const softConfigSchema = z.object({
  slug: normalizedSlug,
  label: normalizedString,
  headline: normalizedString,
  description: normalizedString,
  ctaLabel: normalizedString,
  manifesto: z.array(normalizedString).min(1),
  heroPriority: z.array(normalizedSlug).default([]),
});

export type Hero = z.infer<typeof heroSchema>;
export type News = z.infer<typeof newsSchema>;
export type TaxonomyTag = z.infer<typeof taxonomyTagSchema>;
export type TaxonomyCategory = z.infer<typeof taxonomyCategorySchema>;
export type LatestIndex = z.infer<typeof latestIndexSchema>;
export type SiteSettings = z.infer<typeof siteSettingsSchema>;
export type SoftConfig = z.infer<typeof softConfigSchema>;

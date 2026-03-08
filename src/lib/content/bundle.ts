import { z } from "zod";

import {
  heroSchema,
  latestIndexSchema,
  newsSchema,
  siteSettingsSchema,
  softConfigSchema,
  taxonomyCategorySchema,
  taxonomyTagSchema,
} from "@/lib/content/schemas";

export const taxonomyPayloadSchema = z.object({
  tags: z.array(taxonomyTagSchema),
  categories: z.array(taxonomyCategorySchema),
});

export const siteBundleSchema = z.object({
  settings: siteSettingsSchema,
  soft: softConfigSchema,
});

export const portalBundleSchema = z.object({
  exportedAt: z.string().optional(),
  heroes: z.array(heroSchema).default([]),
  news: z.array(newsSchema).default([]),
  taxonomy: taxonomyPayloadSchema.optional(),
  site: siteBundleSchema.optional(),
  latestIndex: latestIndexSchema.optional(),
});

export type TaxonomyPayload = z.infer<typeof taxonomyPayloadSchema>;
export type SiteBundle = z.infer<typeof siteBundleSchema>;
export type PortalBundle = z.infer<typeof portalBundleSchema>;

function hasBundleContent(bundle: PortalBundle) {
  return Boolean(
    bundle.heroes.length ||
      bundle.news.length ||
      bundle.taxonomy ||
      bundle.site ||
      bundle.latestIndex,
  );
}

export function parsePortalBundle(payload: unknown) {
  const parsed = Array.isArray(payload)
    ? portalBundleSchema.parse({ news: payload })
    : portalBundleSchema.parse(payload);

  if (!hasBundleContent(parsed)) {
    throw new Error("Import payload does not include any content sections.");
  }

  return parsed;
}

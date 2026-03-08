import { getHeroBySlug } from "@/lib/content/repository";
import {
  createOgImageResponse,
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
} from "@/lib/og";

export const runtime = "nodejs";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const hero = await getHeroBySlug(slug);

  if (!hero) {
    return createOgImageResponse({
      eyebrow: "Hero coverage",
      title: "SOFT Rift",
      description: "Premium MLBB hero intelligence and editorial coverage.",
      chips: ["Hero", "MLBB"],
      variant: "hero",
      watermark: "HR",
    });
  }

  return createOgImageResponse({
    eyebrow: hero.title,
    title: hero.name,
    description: hero.seo.description,
    accent: hero.accent,
    chips: [...hero.role, ...hero.lane, hero.isSoftFeatured ? "SOFT" : "Hero"],
    footerLeft: hero.specialty.join(" / "),
    footerRight: `${hero.releaseYear} release`,
    variant: "hero",
    watermark: hero.name.slice(0, 2).toUpperCase(),
  });
}

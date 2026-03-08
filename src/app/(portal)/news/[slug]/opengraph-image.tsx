import { getHeroBySlug, getNewsBySlug } from "@/lib/content/repository";
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
  const story = await getNewsBySlug(slug, true);

  if (!story) {
    return createOgImageResponse({
      eyebrow: "Editorial story",
      title: "SOFT Rift",
      description: "Premium MLBB article coverage and SOFT-ranked reads.",
      chips: ["News", "MLBB"],
      variant: "story",
      watermark: "ED",
    });
  }

  const hero = await getHeroBySlug(story.heroSlug);

  return createOgImageResponse({
    eyebrow: story.isSoft ? "SOFT story" : story.category,
    title: story.title,
    description: story.seo.description,
    accent: hero?.accent ?? "#65e6ff",
    chips: [
      hero?.name ?? story.heroSlug,
      story.readingTime ? `${story.readingTime} min` : "",
      story.status,
      story.isSoft ? "SOFT" : "Editorial",
    ],
    footerLeft: new Date(story.publishedAt).toLocaleDateString("en-US"),
    footerRight: story.author,
    variant: "story",
    watermark: (hero?.name ?? story.heroSlug).slice(0, 2).toUpperCase(),
  });
}

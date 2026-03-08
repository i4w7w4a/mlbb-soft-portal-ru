import { getSoftConfig, getSiteSettings } from "@/lib/content/repository";
import {
  createOgImageResponse,
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
} from "@/lib/og";

export const runtime = "nodejs";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default async function OpenGraphImage() {
  const [settings, softConfig] = await Promise.all([getSiteSettings(), getSoftConfig()]);

  return createOgImageResponse({
    eyebrow: settings.siteTagline,
    title: settings.siteName,
    description: softConfig.headline,
    accent: "#65e6ff",
    chips: ["MLBB", "SOFT", "Editorial hub"],
    footerLeft: settings.siteDescription,
    footerRight: softConfig.label,
    variant: "portal",
    watermark: "SOFT",
  });
}

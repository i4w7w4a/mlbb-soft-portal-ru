import type { Metadata } from "next";

import { siteConfig } from "@/lib/site-config";

export function createMetadata({
  title,
  description,
  path = "/",
}: {
  title: string;
  description: string;
  path?: string;
}): Metadata {
  const fullTitle = `${title} | ${siteConfig.title}`;
  const url = new URL(path, process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");

  return {
    title: fullTitle,
    description,
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: siteConfig.title,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
    },
  };
}


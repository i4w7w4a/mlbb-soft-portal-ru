import type { Route } from "next";

export const siteConfig = {
  title: "SOFT Rift",
  shortTitle: "SOFT",
  description:
    "Premium Mobile Legends editorial portal focused on hero universes, patch intelligence and the SOFT content layer.",
  repo: "https://github.com/i4w7w4a/mlbb-soft-portal",
  author: "Open Orche",
};

export const navigation = [
  { label: "Home", href: "/" },
  { label: "Heroes", href: "/heroes" },
  { label: "News", href: "/news" },
  { label: "SOFT", href: "/soft" },
  { label: "Search", href: "/search" },
] satisfies ReadonlyArray<{ label: string; href: Route }>;

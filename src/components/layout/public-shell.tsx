"use client";

import { motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { useSoftMode } from "@/components/providers/soft-mode-provider";
import type { Hero, News } from "@/lib/content/schemas";
import { cn } from "@/lib/utils";

export function PublicShell({
  heroes,
  news,
  children,
}: {
  heroes: Hero[];
  news: News[];
  children: ReactNode;
}) {
  const { enabled, setEnabled } = useSoftMode();
  const reduceMotion = useReducedMotion();
  const pathname = usePathname();
  const routeKey = pathname === "/" ? "home" : pathname.startsWith("/heroes/") ? "hero" : pathname.startsWith("/news/") ? "news" : pathname.startsWith("/soft") ? "soft" : "default";

  return (
    <div
      data-route={routeKey}
      className={cn("portal-shell min-h-screen overflow-x-clip text-white", enabled && "portal-shell--soft")}
    >
      <SiteHeader heroes={heroes} news={news} softEnabled={enabled} onSoftToggle={setEnabled} />
      <motion.main
        initial={reduceMotion ? undefined : { opacity: 0, y: 18 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="pb-24 pt-8"
      >
        {children}
      </motion.main>
      <SiteFooter />
    </div>
  );
}

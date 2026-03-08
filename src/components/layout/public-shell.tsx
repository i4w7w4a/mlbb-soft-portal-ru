"use client";

import { motion, useReducedMotion } from "motion/react";
import { type ReactNode } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { useSoftMode } from "@/components/providers/soft-mode-provider";
import type { Hero, News } from "@/lib/content/schemas";

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

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(101,230,255,0.12),transparent_24%),radial-gradient(circle_at_20%_20%,rgba(134,148,255,0.18),transparent_26%),#050913] text-white">
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

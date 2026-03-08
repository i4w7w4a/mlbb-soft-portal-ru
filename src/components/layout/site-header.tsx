"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu, Sparkles } from "lucide-react";

import { CommandPalette } from "@/components/search/command-palette";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { navigation } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import type { Hero, News } from "@/lib/content/schemas";

function isCurrentRoute(pathname: string, href: string) {
  if (href === "/") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader({
  heroes,
  news,
  softEnabled,
  onSoftToggle,
}: {
  heroes: Hero[];
  news: News[];
  softEnabled: boolean;
  onSoftToggle: (value: boolean) => void;
}) {
  const pathname = usePathname();

  return (
    <header className="sticky top-4 z-40 mx-auto w-[min(100%-1.5rem,88rem)]">
      <div className="soft-header-bar rounded-[2rem] border border-white/10 bg-black/55 px-4 py-3 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/" className="flex min-w-0 items-center gap-3 rounded-full px-2 py-1">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full border border-cyan-300/25 bg-cyan-300/10 text-cyan-100">
                <Sparkles className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-display text-lg text-white">SOFT Rift</p>
                <p className="truncate text-[10px] uppercase tracking-[0.3em] text-slate-500">
                  MLBB editorial portal
                </p>
              </div>
            </Link>
            <nav className="hidden items-center gap-1 xl:flex">
              {navigation.map((item) => {
                const active = isCurrentRoute(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm transition-colors duration-200",
                      active
                        ? "bg-cyan-300/12 text-white ring-1 ring-cyan-300/30"
                        : "text-slate-300 hover:bg-white/6 hover:text-white",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden xl:block">
              <CommandPalette heroes={heroes} news={news} className="min-w-[19rem]" />
            </div>
            <div className="flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/8 px-3 py-2 sm:px-4">
              <span className="font-display text-xs tracking-[0.24em] text-cyan-100 sm:text-sm">
                SOFT
              </span>
              <Switch checked={softEnabled} onCheckedChange={onSoftToggle} />
            </div>
            <Link href="/soft" className="hidden md:block">
              <Button variant="soft" size="sm">
                Enter SOFT
              </Button>
            </Link>
            <Dialog>
              <DialogTrigger
                aria-label="Open navigation menu"
                className="inline-flex size-11 items-center justify-center rounded-full border border-white/10 bg-white/6 text-slate-300 transition-colors duration-200 hover:border-white/18 hover:bg-white/8 hover:text-white xl:hidden"
              >
                <Menu className="size-4" />
              </DialogTrigger>
              <DialogContent className="!left-auto !right-3 !top-24 !w-[min(94vw,24rem)] !translate-x-0 !translate-y-0 overflow-hidden p-0">
                <div className="space-y-6 p-6">
                  <div className="space-y-2">
                    <DialogTitle>Navigate the portal</DialogTitle>
                    <DialogDescription>
                      Jump between editorial surfaces, hero universes, and the SOFT hub
                      without losing the current rhythm.
                    </DialogDescription>
                  </div>
                  <div className="space-y-2">
                    {navigation.map((item) => {
                      const active = isCurrentRoute(pathname, item.href);

                      return (
                        <DialogClose key={item.href} asChild>
                          <Link
                            href={item.href}
                            className={cn(
                              "flex items-center justify-between rounded-[1.4rem] border px-4 py-3 text-sm transition-colors duration-200",
                              active
                                ? "border-cyan-300/30 bg-cyan-300/10 text-white"
                                : "border-white/8 bg-white/5 text-slate-200 hover:border-white/16 hover:bg-white/8 hover:text-white",
                            )}
                          >
                            <span>{item.label}</span>
                            <ArrowRight className="size-4 opacity-70" />
                          </Link>
                        </DialogClose>
                      );
                    })}
                  </div>
                  <div className="rounded-[1.6rem] border border-cyan-300/12 bg-cyan-300/6 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-display text-base text-cyan-50">SOFT Mode</p>
                        <p className="mt-1 text-sm leading-6 text-slate-300">
                          Shift interface emphasis toward SOFT-ranked stories and hero signals.
                        </p>
                      </div>
                      <Switch checked={softEnabled} onCheckedChange={onSoftToggle} />
                    </div>
                    <DialogClose asChild>
                      <Link
                        href="/soft"
                        className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/12 px-4 text-sm font-medium text-cyan-100 transition-colors duration-200 hover:bg-cyan-300/18 hover:text-cyan-50"
                      >
                        Open SOFT hub
                      </Link>
                    </DialogClose>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="mt-3 xl:hidden">
          <CommandPalette heroes={heroes} news={news} />
        </div>
      </div>
    </header>
  );
}

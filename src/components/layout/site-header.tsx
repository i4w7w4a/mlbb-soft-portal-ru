import Link from "next/link";
import { Menu, Sparkles } from "lucide-react";

import { CommandPalette } from "@/components/search/command-palette";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { navigation } from "@/lib/site-config";
import type { Hero, News } from "@/lib/content/schemas";

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
  return (
    <header className="sticky top-4 z-40 mx-auto w-[min(100%-1.5rem,88rem)]">
      <div className="rounded-full border border-white/10 bg-black/50 px-4 py-3 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-3 md:justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 rounded-full px-2 py-1">
              <div className="flex size-11 items-center justify-center rounded-full border border-cyan-300/25 bg-cyan-300/10 text-cyan-100">
                <Sparkles className="size-5" />
              </div>
              <div>
                <p className="font-display text-lg text-white">SOFT Rift</p>
                <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">
                  MLBB editorial portal
                </p>
              </div>
            </Link>
            <nav className="hidden items-center gap-1 lg:flex">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-white/6 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden xl:block">
              <CommandPalette heroes={heroes} news={news} />
            </div>
            <div className="flex items-center gap-3 rounded-full border border-cyan-300/20 bg-cyan-300/8 px-4 py-2">
              <span className="font-display text-sm tracking-[0.24em] text-cyan-100">
                SOFT
              </span>
              <Switch checked={softEnabled} onCheckedChange={onSoftToggle} />
            </div>
            <Link href="/soft">
              <Button variant="soft" size="sm">
                Enter SOFT
              </Button>
            </Link>
            <button className="inline-flex size-11 items-center justify-center rounded-full border border-white/10 bg-white/6 text-slate-300 lg:hidden">
              <Menu className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}


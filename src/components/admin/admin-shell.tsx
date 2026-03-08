import type { Route } from "next";
import Link from "next/link";

import { Card } from "@/components/ui/card";

const adminNav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/news", label: "News" },
  { href: "/admin/news/new", label: "Create" },
  { href: "/admin/heroes", label: "Heroes" },
  { href: "/admin/media", label: "Media" },
] satisfies ReadonlyArray<{ href: Route; label: string }>;

export function AdminShell({
  children,
  demoMode,
}: {
  children: React.ReactNode;
  demoMode: boolean;
}) {
  return (
    <div className="min-h-screen bg-[#060914] px-4 py-6 text-white">
      <div className="mx-auto grid w-[min(100%,90rem)] gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <Card className="h-fit space-y-5">
          <div>
            <p className="font-display text-2xl text-white">Admin Core</p>
            <p className="mt-2 text-sm text-slate-400">
              JSON-first editorial controls with a premium operator surface.
            </p>
          </div>
          {demoMode ? (
            <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
              Local demo mode is enabled because Supabase env vars are missing.
            </div>
          ) : null}
          <nav className="space-y-2">
            {adminNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-2xl border border-white/8 px-4 py-3 text-sm text-slate-200 transition-colors hover:border-cyan-300/20 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </Card>
        <div>{children}</div>
      </div>
    </div>
  );
}

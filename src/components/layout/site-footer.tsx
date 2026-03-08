import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/8 py-10">
      <div className="mx-auto flex w-[min(100%-1.5rem,88rem)] flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="font-display text-2xl text-white">SOFT Rift</p>
          <p className="max-w-xl text-sm leading-6 text-slate-400">
            Premium MLBB editorial portal centered on hero universes, high-signal news and the SOFT layer.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-slate-400">
          <Link href="/heroes" className="hover:text-white">
            Heroes
          </Link>
          <Link href="/news" className="hover:text-white">
            News
          </Link>
          <Link href="/soft" className="hover:text-white">
            SOFT
          </Link>
          <Link href="/admin" className="hover:text-white">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}


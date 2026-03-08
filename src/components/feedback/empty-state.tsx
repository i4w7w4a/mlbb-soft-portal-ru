import { SearchX } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function EmptyState({
  eyebrow,
  title,
  description,
  tone = "default",
  icon,
  meta,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  tone?: "default" | "soft";
  icon?: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "overflow-hidden border-dashed px-6 py-8 text-center md:px-8 md:py-10",
        tone === "soft"
          ? "border-cyan-300/18 bg-[radial-gradient(circle_at_top,rgba(101,230,255,0.16),transparent_42%),linear-gradient(180deg,rgba(8,19,31,0.96),rgba(4,9,17,0.98))]"
          : "border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_40%),linear-gradient(180deg,rgba(10,17,30,0.88),rgba(5,9,18,0.95))]",
        className,
      )}
    >
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-5">
        <div
          className={cn(
            "flex size-14 items-center justify-center rounded-full border",
            tone === "soft"
              ? "border-cyan-300/24 bg-cyan-300/12 text-cyan-100"
              : "border-white/10 bg-white/7 text-slate-200",
          )}
        >
          {icon ?? <SearchX className="size-5" />}
        </div>
        <div className="space-y-3">
          {eyebrow ? (
            <p
              className={cn(
                "text-xs uppercase tracking-[0.28em]",
                tone === "soft" ? "text-cyan-100/75" : "text-slate-500",
              )}
            >
              {eyebrow}
            </p>
          ) : null}
          <div className="space-y-2">
            <p className="font-display text-[clamp(1.8rem,3vw,2.75rem)] leading-none text-white">
              {title}
            </p>
            <p className="text-sm leading-7 text-slate-300">{description}</p>
          </div>
        </div>
        {meta ? <div className="flex flex-wrap justify-center gap-2">{meta}</div> : null}
        {actions ? <div className="flex flex-wrap justify-center gap-3">{actions}</div> : null}
      </div>
    </Card>
  );
}

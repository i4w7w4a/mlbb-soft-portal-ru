import type { Route } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  linkLabel = "View all",
  soft = false,
  className,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  href?: Route;
  linkLabel?: string;
  soft?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-5 md:flex-row md:items-end md:justify-between", className)}>
      <div className="max-w-2xl space-y-3">
        {eyebrow ? (
          <Badge variant={soft ? "soft" : "default"} className="w-fit">
            {eyebrow}
          </Badge>
        ) : null}
        <div className="space-y-2">
          <h2 className="font-display text-3xl tracking-tight text-white md:text-4xl">
            {title}
          </h2>
          <p className="max-w-2xl text-base leading-7 text-slate-300">{description}</p>
        </div>
      </div>
      {href ? (
        <Link
          href={href}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-200 transition-colors hover:text-white"
        >
          {linkLabel}
          <ArrowRight className="size-4" />
        </Link>
      ) : null}
    </div>
  );
}

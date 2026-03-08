import Image from "next/image";

import type { Hero } from "@/lib/content/schemas";
import { cn } from "@/lib/utils";

const sizeClasses = {
  sm: "h-[4.5rem] w-[4.5rem] rounded-[24px]",
  md: "h-24 w-24 rounded-[28px]",
  lg: "h-32 w-32 rounded-[36px]",
} as const;

const sizeHints = {
  sm: "72px",
  md: "96px",
  lg: "128px",
} as const;

export function HeroEmblem({
  hero,
  size = "md",
  className,
}: {
  hero: Hero;
  size?: keyof typeof sizeClasses;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden border border-white/14 bg-black/45 shadow-[0_18px_50px_rgba(0,0,0,0.38)]",
        sizeClasses[size],
        className,
      )}
      style={{
        boxShadow: `0 0 0 1px ${hero.accent}24, 0 18px 50px rgba(0,0,0,0.38)`,
      }}
    >
      <div
        className="absolute inset-0 opacity-90"
        style={{
          background: `radial-gradient(circle at 50% 20%, ${hero.accent}22, transparent 58%), linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0))`,
        }}
      />
      <Image
        src={hero.avatar}
        alt={`${hero.name} emblem`}
        fill
        unoptimized
        sizes={sizeHints[size]}
        className="object-cover"
      />
      <div
        className="absolute inset-x-3 bottom-3 h-px opacity-85"
        style={{
          background: `linear-gradient(90deg, transparent, ${hero.accent}, transparent)`,
        }}
      />
    </div>
  );
}

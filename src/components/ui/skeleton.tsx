import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative overflow-hidden rounded-[1.4rem] border border-white/6 bg-white/7 before:absolute before:inset-0 before:-translate-x-full before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.16),transparent)] before:content-[''] motion-safe:before:animate-[skeleton-shimmer_1.8s_ease-in-out_infinite]",
        className,
      )}
      {...props}
    />
  );
}

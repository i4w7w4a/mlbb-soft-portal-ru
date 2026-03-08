import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function SectionHeadingSkeleton() {
  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl space-y-3">
        <Skeleton className="h-6 w-32 rounded-full" />
        <div className="space-y-3">
          <Skeleton className="h-12 w-full max-w-xl" />
          <Skeleton className="h-5 w-full max-w-2xl" />
          <Skeleton className="h-5 w-[82%] max-w-xl" />
        </div>
      </div>
      <Skeleton className="h-11 w-32 rounded-full" />
    </div>
  );
}

function FilterBarSkeleton({
  slots = 4,
}: {
  slots?: number;
}) {
  return (
    <Card className="grid gap-4 lg:grid-cols-[2fr_repeat(3,minmax(0,1fr))]">
      <Skeleton className="h-12 rounded-2xl" />
      {Array.from({ length: slots - 1 }).map((_, index) => (
        <Skeleton key={`filter-${index}`} className="h-12 rounded-2xl" />
      ))}
    </Card>
  );
}

function StoryCardSkeleton({
  large = false,
}: {
  large?: boolean;
}) {
  return (
    <Card className="space-y-5 overflow-hidden">
      <Skeleton className="h-48 w-full rounded-[1.8rem]" />
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-7 w-24 rounded-full" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="space-y-3">
        <Skeleton className={large ? "h-11 w-[88%]" : "h-9 w-[78%]"} />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-[84%]" />
      </div>
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-[4.5rem]" />
      </div>
    </Card>
  );
}

function HeroCardSkeleton({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <Card className="space-y-6 overflow-hidden">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-7 w-24 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className={compact ? "size-16 rounded-full" : "size-20 rounded-full"} />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-10 w-[66%]" />
        <Skeleton className="h-4 w-[44%]" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-[82%]" />
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: compact ? 2 : 3 }).map((_, index) => (
          <Skeleton key={`specialty-${index}`} className="h-8 w-24 rounded-full" />
        ))}
      </div>
    </Card>
  );
}

export function PortalHubLoading() {
  return (
    <div className="mx-auto flex w-[min(100%-1.5rem,88rem)] flex-col gap-10">
      <Card className="grid gap-6 overflow-hidden xl:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-5">
          <Skeleton className="h-6 w-32 rounded-full" />
          <Skeleton className="h-16 w-full max-w-3xl" />
          <Skeleton className="h-5 w-full max-w-2xl" />
          <Skeleton className="h-5 w-[82%] max-w-2xl" />
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-12 w-40 rounded-full" />
            <Skeleton className="h-12 w-36 rounded-full" />
          </div>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={`hub-note-${index}`} className="h-24 rounded-[1.7rem]" />
          ))}
        </div>
      </Card>
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <HeroCardSkeleton />
        <div className="grid gap-6">
          <Card className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={`filter-chip-${index}`} className="h-10 w-24 rounded-full" />
              ))}
            </div>
            <Skeleton className="h-24 rounded-[1.8rem]" />
          </Card>
          <StoryCardSkeleton large />
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <StoryCardSkeleton key={`news-${index}`} />
        ))}
      </div>
    </div>
  );
}

export function PortalExplorerLoading({
  tone = "heroes",
}: {
  tone?: "heroes" | "news" | "soft" | "search";
}) {
  const isHeroTone = tone === "heroes";

  return (
    <div className="mx-auto flex w-[min(100%-1.5rem,88rem)] flex-col gap-10">
      <SectionHeadingSkeleton />
      <FilterBarSkeleton slots={4} />
      <div className={isHeroTone ? "grid gap-5 md:grid-cols-2 xl:grid-cols-3" : "grid gap-5 lg:grid-cols-2"}>
        {Array.from({ length: isHeroTone ? 6 : 4 }).map((_, index) =>
          isHeroTone ? (
            <HeroCardSkeleton key={`hero-card-${index}`} compact={index > 2} />
          ) : (
            <StoryCardSkeleton key={`story-card-${index}`} large={index === 0} />
          ),
        )}
      </div>
    </div>
  );
}

export function PortalDetailLoading({
  kind,
}: {
  kind: "hero" | "story";
}) {
  return (
    <div className="mx-auto flex w-[min(100%-1.5rem,88rem)] flex-col gap-8">
      <Card className="grid gap-8 overflow-hidden xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-7 w-24 rounded-full" />
            <Skeleton className="h-7 w-28 rounded-full" />
          </div>
          <Skeleton className="h-16 w-full max-w-3xl" />
          <Skeleton className="h-5 w-full max-w-2xl" />
          <Skeleton className="h-5 w-[80%] max-w-2xl" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={`meta-${index}`} className="h-9 w-24 rounded-full" />
            ))}
          </div>
        </div>
        <Skeleton className="min-h-80 rounded-[2rem]" />
      </Card>
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="space-y-4">
          <Skeleton className="h-6 w-36 rounded-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-[88%]" />
          <Skeleton className="h-5 w-[72%]" />
          {kind === "story" ? (
            <>
              <Skeleton className="mt-6 h-8 w-56" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-[78%]" />
            </>
          ) : null}
        </Card>
        <div className="grid gap-5">
          <StoryCardSkeleton large={kind === "hero"} />
          <StoryCardSkeleton />
        </div>
      </div>
    </div>
  );
}

export function AdminSurfaceLoading() {
  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-5 w-full max-w-3xl" />
        <Skeleton className="h-5 w-[84%] max-w-2xl" />
      </Card>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={`admin-stat-${index}`} className="space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-11 w-16" />
          </Card>
        ))}
      </div>
      <Card className="space-y-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,0.8fr))]">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={`admin-filter-${index}`} className="h-12 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-20 rounded-[1.8rem]" />
      </Card>
      <div className="grid gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={`admin-row-${index}`} className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-7 w-20 rounded-full" />
              <Skeleton className="h-7 w-24 rounded-full" />
              <Skeleton className="h-7 w-28 rounded-full" />
            </div>
            <Skeleton className="h-10 w-[70%]" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-[84%]" />
            <div className="flex gap-3">
              <Skeleton className="h-10 w-28 rounded-full" />
              <Skeleton className="h-10 w-32 rounded-full" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

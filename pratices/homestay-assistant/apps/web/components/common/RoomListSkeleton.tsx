import { cn } from "@repo/utils";

type RoomListSkeletonProps = {
  className?: string;
  itemCount?: number;
};

const SkeletonItem = () => (
  <div className="w-full min-w-0 rounded-2xl border border-white/8 bg-white/[0.02] p-3">
    <div className="aspect-[4/3] animate-pulse rounded-xl bg-zinc-900" />
    <div className="mt-4 space-y-3">
      <div className="h-4 w-3/4 animate-pulse rounded-full bg-white/10" />
      <div className="h-3 w-1/2 animate-pulse rounded-full bg-white/[0.08]" />
      <div className="flex gap-2">
        <div className="h-6 w-16 animate-pulse rounded-full bg-white/[0.08]" />
        <div className="h-6 w-20 animate-pulse rounded-full bg-white/[0.08]" />
      </div>
    </div>
  </div>
);

export const RoomListSkeleton = ({
  className,
  itemCount = 6,
}: RoomListSkeletonProps) => (
  <section className={cn("space-y-4", className)} aria-busy="true">
    <div className="flex items-center gap-2">
      <span className="h-4 w-1 rounded-full bg-emerald-500/50" />
      <div className="h-5 w-44 animate-pulse rounded-full bg-white/10" />
    </div>

    <div className="grid grid-cols-2 gap-3 overflow-hidden pb-1">
      {Array.from({ length: itemCount }, (_, index) => (
        <SkeletonItem key={`skeleton-item-${index}`} />
      ))}
    </div>
  </section>
);

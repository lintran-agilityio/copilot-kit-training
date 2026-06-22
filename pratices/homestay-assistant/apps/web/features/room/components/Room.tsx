import { RoomDetails } from "@/features/room/components/RoomDetails";
import { RoomImage } from "@/features/room/components/RoomImage";
import type { Room as RoomType } from "@/features/room/types/room";
import { cn } from "@/utils";

export type RoomCardProps = RoomType & {
  compact?: boolean;
  className?: string;
};

export const Room = ({
  compact = false,
  className,
  ...room
}: RoomCardProps) => {
  return (
    <article
      className={cn(
        "group overflow-hidden rounded-xl border border-white/8 bg-[#111111] transition-colors hover:border-white/15",
        compact ? "max-w-sm" : "min-w-[260px] max-w-[300px] flex-1",
        className,
      )}
    >
      <RoomImage
        imageUrl={room.imageUrl}
        name={room.name}
        level={room.level}
        levelColor={room.levelColor}
        availableSlots={room.availableSlots}
        compact={compact}
      />
      <RoomDetails
        name={room.name}
        capacity={room.capacity}
        description={room.description}
        amenities={room.amenities}
        compact={compact}
      />
    </article>
  );
}

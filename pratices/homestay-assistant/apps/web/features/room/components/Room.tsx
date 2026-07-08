import { RoomInfo, RoomImage } from "@/features/room/components";
import type { Room as RoomType } from "@/features/room/types/room";
import { cn } from "@repo/utils";;

export type Room = RoomType & {
  compact?: boolean;
  className?: string;
};

export const Room = ({
  compact = false,
  className,
  ...room
}: Room) => {
  return (
    <article
      className={cn(
        "group overflow-hidden rounded-xl border border-white/8 bg-[#111111] transition-colors hover:border-white/15",
        compact ? "max-w-sm" : "min-w-[260px] max-w-[300px] flex-1",
        className,
      )}
      key={room.id}
    >
      <RoomImage
        imageUrl={room.imageUrl}
        name={room.name || "Room Image"}
        level={room.level}
        levelColor={room.levelColor}
        availableSlots={room.availableSlots}
        compact={compact}
      />
      <RoomInfo
        name={room.name}
        capacity={room.capacity}
        description={room.description}
        amenities={room.amenities}
        compact={compact}
      />
    </article>
  );
}

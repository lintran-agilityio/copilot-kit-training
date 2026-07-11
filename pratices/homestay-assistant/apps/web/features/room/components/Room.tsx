import { RoomInfo, RoomImage } from "@/features/room/components";
import type { Room as RoomType } from "@/features/room/types/room";
import { cn } from "@repo/utils";

export type RoomSelectPayload = {
  roomId: string;
  roomName: string;
};

export type Room = RoomType & {
  compact?: boolean;
  className?: string;
  onSelect?: (payload: RoomSelectPayload) => void;
};

export const Room = ({
  compact = false,
  className,
  onSelect,
  ...room
}: Room) => {
  const isInteractive = typeof onSelect === "function";

  const handleSelect = () => {
    onSelect?.({
      roomId: room.id,
      roomName: room.name,
    });
  };

  return (
    <article
      className={cn(
        "group overflow-hidden rounded-xl border border-white/8 bg-[#111111] transition-colors hover:border-white/15",
        compact ? "max-w-sm" : "min-w-[260px] max-w-[300px] flex-1",
        isInteractive &&
          "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60",
        className,
      )}
      key={room.id}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={isInteractive ? handleSelect : undefined}
      onKeyDown={
        isInteractive
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleSelect();
              }
            }
          : undefined
      }
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
      {isInteractive ? (
        <p className="border-t border-white/6 px-4 py-2.5 text-xs text-zinc-500 transition-colors group-hover:text-emerald-400/90">
          View details in chat
        </p>
      ) : null}
    </article>
  );
};

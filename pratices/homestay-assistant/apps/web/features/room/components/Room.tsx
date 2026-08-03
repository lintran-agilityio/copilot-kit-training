import { CalendarCheck } from "lucide-react";
import type { MouseEvent } from "react";

import { Button } from "@/components/ui/button";
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
  onBook?: (payload: RoomSelectPayload) => void;
};

export const Room = ({
  compact = false,
  className,
  onSelect,
  onBook,
  ...room
}: Room) => {
  const canViewOnPage = typeof onSelect === "function";
  const canBookInChat = typeof onBook === "function";

  const handleSelect = () => {
    onSelect?.({
      roomId: room.id,
      roomName: room.name,
    });
  };

  const handleBook = (event: MouseEvent) => {
    event.stopPropagation();
    onBook?.({
      roomId: room.id,
      roomName: room.name,
    });
  };

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-xl border border-white/8 bg-[#111111] transition-colors hover:border-white/15",
        "w-full min-w-0",
        canViewOnPage &&
          "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60",
        className,
      )}
      key={room.id}
      role={canViewOnPage ? "button" : undefined}
      tabIndex={canViewOnPage ? 0 : undefined}
      onClick={canViewOnPage ? handleSelect : undefined}
      onKeyDown={
        canViewOnPage
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
        compact={compact}
        capacity={room.capacity}
      />
      <div className="flex-1">
        <RoomInfo
          name={room.name}
          description={room.description}
          amenities={room.amenities}
          compact={compact}
        />
      </div>
      {canViewOnPage || canBookInChat ? (
        <div
          className={cn(
            "flex items-center gap-2 border-t border-white/6 px-3 py-2.5",
            canBookInChat && canViewOnPage ? "justify-between" : "justify-end",
          )}
        >
          {canViewOnPage ? (
            <p className="text-xs text-zinc-500 transition-colors group-hover:text-zinc-300">
              View {!compact ? "on page" : ""}
            </p>
          ) : null}
          {canBookInChat ? (
            <Button
              type="button"
              size="sm"
              className="h-8 gap-1.5 bg-emerald-500/15 px-3 text-xs font-medium text-emerald-300 hover:bg-emerald-500/25 hover:text-emerald-200"
              onClick={handleBook}
            >
              <CalendarCheck className="size-3.5" />
              Book
            </Button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
};

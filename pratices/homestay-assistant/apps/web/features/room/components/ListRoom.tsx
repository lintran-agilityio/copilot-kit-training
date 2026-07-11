"use client";

import { Room } from "@/features/room/components/Room";
import { useRequestRoomDetail } from "@/features/room/hooks";
import type { Room as RoomType } from "@/features/room/types/room";
import { cn } from "@repo/utils";

type ListRoomProps = {
  rooms: RoomType[];
  title?: string;
  compact?: boolean;
  className?: string;
};

export const ListRoom = ({
  rooms,
  title,
  compact = false,
  className,
}: ListRoomProps) => {
  const requestRoomDetail = useRequestRoomDetail();

  return (
    <section className={cn("space-y-4", className)}>
      {rooms?.length > 0 ? (
        <>
          {title ? (
            <div className="flex items-center gap-2">
              <span className="h-4 w-1 rounded-full bg-emerald-500" />
              <h2 className="text-lg font-medium text-zinc-300">{title}</h2>
            </div>
          ) : null}

          <div
            className={cn(
              "app-scrollbar",
              compact
                ? "flex max-h-[70vh] flex-col gap-3 overflow-y-auto pr-1"
                : "flex flex-wrap gap-4 overflow-x-auto pb-1",
            )}
          >
            {rooms.map((room, index) => (
              <div key={`${room.id}-${index}`}>
                <Room
                  key={room.id}
                  {...room}
                  compact={compact}
                  onSelect={requestRoomDetail}
                />
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex h-full items-center justify-center">
          <p className="text-zinc-400">No rooms found</p>
        </div>
      )}
    </section>
  );
};

"use client";

import { EmptyMessages } from "@repo/components";
import { Room } from "@/features/room/components/Room";
import {
  useOpenRoomOnPage,
  useRequestRoomBookingForm,
} from "@/features/room/hooks";
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
  const openRoomOnPage = useOpenRoomOnPage();
  const requestRoomBookingForm = useRequestRoomBookingForm();

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
                ? "grid max-h-[70vh] grid-cols-2 gap-3 overflow-y-auto pr-1"
                : "grid grid-cols-1 gap-4 pb-1 sm:grid-cols-2 lg:grid-cols-3",
            )}
          >
            {rooms.map((room, index) => (
              <div key={`${room.id}-${index}`}>
                <Room
                  key={room.id}
                  {...room}
                  compact={compact}
                  onSelect={openRoomOnPage}
                  onBook={requestRoomBookingForm}
                />
              </div>
            ))}
          </div>
        </>
      ) : (
        <EmptyMessages emptyMessage="No rooms found" />
      )}
    </section>
  );
};

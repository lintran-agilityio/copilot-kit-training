"use client";

import { ListRoom } from "@/features/room/components/ListRoom";
import { useRoomStore } from "@/features/room/stores/room-store";
import type { Room } from "@/features/room/types/room";

type RoomGridProps = {
  initialRooms: Room[];
  className?: string;
};

export const RoomGrid = ({ initialRooms, className }: RoomGridProps) => {
  const storeRooms = useRoomStore((state) => state.rooms);
  const title = useRoomStore((state) => state.roomListTitle);
  const rooms =
    title !== undefined
      ? storeRooms
      : storeRooms.length > 0
        ? storeRooms
        : initialRooms;

  return (
    <>
      {rooms.length > 0 ? (
        <ListRoom rooms={rooms} title={title} className={className} />
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-zinc-400">No rooms found</p>
        </div>
      )}
    </>
  );
};

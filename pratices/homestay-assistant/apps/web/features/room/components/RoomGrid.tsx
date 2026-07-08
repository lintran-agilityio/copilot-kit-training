"use client";

import { RoomListSkeleton } from "@/components/common";
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
  const isLoading = useRoomStore((state) => state.isRoomListLoading);
  const rooms =
    title !== undefined
      ? storeRooms
      : storeRooms.length > 0
        ? storeRooms
        : initialRooms;
  const hasRooms = rooms.length > 0;

  if (isLoading && !hasRooms) {
    return <RoomListSkeleton className={className} />;
  }

  return (
    <>
      <ListRoom rooms={rooms} title={title} className={className} />
    </>
  );
};

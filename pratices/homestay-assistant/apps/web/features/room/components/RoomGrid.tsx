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
  const rooms = storeRooms.length > 0 ? storeRooms : initialRooms;

  return <ListRoom rooms={rooms} title={title} className={className} />;
};

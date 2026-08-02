"use client";

import { ArrowLeft } from "lucide-react";

import { RoomListSkeleton } from "@/components/common";
import { Button } from "@/components/ui/button";
import { ListRoom, RoomDetail } from "@/features/room/components";
import { useRoomStore } from "@/features/room/stores/room-store";
import type { Room } from "@/features/room/types/room";
import { cn } from "@repo/utils";

type RoomGridProps = {
  initialRooms: Room[];
  className?: string;
};

export const RoomGrid = ({ initialRooms, className }: RoomGridProps) => {
  const storeRooms = useRoomStore((state) => state.rooms);
  const title = useRoomStore((state) => state.roomListTitle);
  const isLoading = useRoomStore((state) => state.isRoomListLoading);
  const selectedRoomId = useRoomStore((state) => state.selectedRoomId);
  const clearSelectedRoom = useRoomStore((state) => state.clearSelectedRoom);
  const rooms =
    title !== undefined
      ? storeRooms
      : storeRooms.length > 0
        ? storeRooms
        : initialRooms;
  const hasRooms = rooms.length > 0;
  const selectedRoom =
    selectedRoomId != null
      ? (rooms.find((room) => room.id === selectedRoomId) ??
        initialRooms.find((room) => room.id === selectedRoomId))
      : undefined;

  if (isLoading && !hasRooms) {
    return <RoomListSkeleton className={className} />;
  }

  if (selectedRoom) {
    return (
      <div className={cn("space-y-4", className)}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-2 text-zinc-400 hover:text-white"
          onClick={clearSelectedRoom}
        >
          <ArrowLeft className="size-4" />
          Back to rooms
        </Button>
        <RoomDetail {...selectedRoom} variant="page" />
      </div>
    );
  }

  return <ListRoom rooms={rooms} title={title} className={className} />;
};

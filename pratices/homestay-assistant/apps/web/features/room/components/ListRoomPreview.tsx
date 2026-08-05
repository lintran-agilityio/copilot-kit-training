"use client";

import { useCallback, useState } from "react";

import { ListRoom } from "@/features/room/components/ListRoom";
import type { RoomSelectPayload } from "@/features/room/components/Room";
import { RoomChatDetail } from "@/features/room/components/RoomChatDetail";
import { useRequestRoomBookingForm } from "@/features/room/hooks";
import { Room } from "@/features/room/types";

type ListRoomPreviewProps = {
  rooms?: Room[];
  title?: string;
};

/**
 * Chat-only room results. Viewing a room swaps this card for a chat-sized
 * detail view; nothing here touches the page room grid.
 */
export const ListRoomPreview = ({ rooms = [], title }: ListRoomPreviewProps) => {
  const [viewedRoomId, setViewedRoomId] = useState<string | null>(null);
  const requestRoomBookingForm = useRequestRoomBookingForm();

  const viewedRoom = viewedRoomId
    ? rooms.find((room) => room.id === viewedRoomId)
    : undefined;

  const handleView = useCallback(({ roomId }: RoomSelectPayload) => {
    setViewedRoomId(roomId);
  }, []);

  const handleBookInChat = useCallback(
    ({ roomId, roomName }: RoomSelectPayload) => {
      requestRoomBookingForm({ roomId, roomName, openOnPage: false });
    },
    [requestRoomBookingForm],
  );

  if (viewedRoom) {
    return (
      <RoomChatDetail
        room={viewedRoom}
        onBack={() => setViewedRoomId(null)}
        onBook={handleBookInChat}
      />
    );
  }

  return (
    <ListRoom
      rooms={rooms}
      title={title ?? "Room results"}
      compact
      className="max-w-full rounded-xl border border-white/12 bg-[#111111] p-3.5"
      onSelectRoom={handleView}
      onBookRoom={handleBookInChat}
    />
  );
};

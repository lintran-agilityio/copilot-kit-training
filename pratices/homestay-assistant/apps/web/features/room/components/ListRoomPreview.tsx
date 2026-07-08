import { useEffect } from "react";

import { Room } from "../types/room";
import { useRoomStore } from "../stores/room-store";
import { ListRoom } from "./ListRoom";

type RoomResultsPreviewProps = {
  rooms?: Room[];
  title?: string;
};

export const RoomResultsPreview = ({ rooms, title }: RoomResultsPreviewProps) => {
  const previewRooms = rooms ?? [];

  useEffect(() => {
    if (previewRooms.length > 0) {
      useRoomStore.getState().setRoomListLoading(false);
    }
  }, [previewRooms.length]);

  if (previewRooms.length === 0) {
    return null;
  }

  return (
    <ListRoom
      rooms={previewRooms}
      title={title ?? "Room results"}
      compact
      className="max-w-full rounded-2xl border border-white/8 bg-white/[0.02] p-4"
    />
  );
};

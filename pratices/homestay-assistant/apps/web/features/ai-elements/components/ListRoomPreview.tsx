import { useEffect } from "react";

import { Room } from "@/features/room/types";
import { useRoomStore } from "@/features/room/stores/room-store";
import { ListRoom } from "@/features/room/components";

type ListRoomPreviewProps = {
  rooms?: Room[];
  title?: string;
};

export const ListRoomPreview = ({ rooms, title }: ListRoomPreviewProps) => {
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

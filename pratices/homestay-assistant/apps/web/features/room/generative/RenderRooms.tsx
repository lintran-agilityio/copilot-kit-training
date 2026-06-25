"use client";

import { Loading } from "@repo/components";

import { ListRoom } from "../components";
import { useRoomsByIds } from "../hooks/use-rooms-by-ids";

type RenderRoomsProps = {
  roomIds: string[];
  title?: string;
};

export const RenderRooms = ({ roomIds, title }: RenderRoomsProps) => {
  const { rooms, isLoading } = useRoomsByIds(roomIds);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loading />
      </div>
    );
  }

  return <ListRoom rooms={rooms} title={title} />;
};

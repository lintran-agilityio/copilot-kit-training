"use client";

import { getRoomsByIds } from "@/data/rooms";
import { ListRoom } from "../components";

type RenderRoomsProps = {
  roomIds: string[];
  title?: string;
};

export const RenderRooms = ({
  roomIds,
  title,
}: RenderRoomsProps) => {
  const rooms = getRoomsByIds(roomIds);

  return (
    <ListRoom rooms={rooms} title={title} compact />
  )
};

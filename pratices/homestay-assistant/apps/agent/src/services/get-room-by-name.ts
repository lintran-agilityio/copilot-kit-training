import { ROUTES } from "@repo/constants";
import { z } from "zod";

import { type GetRoomByNameOutput, roomSchema } from "../mastra/schemas/rooms";
import { get } from "./common";

const getRoomsByNameResponseSchema = z.array(roomSchema);

export const findRoomByName = async (
  roomName: string
): Promise<GetRoomByNameOutput> => {
  const queryName = roomName.trim();
  const rooms = await get(ROUTES.ROOM_BY_NAME, getRoomsByNameResponseSchema, {
    searchParams: { name: queryName },
    errorMessage: "Failed to find room by name",
  });

  return { rooms, queryName };
};

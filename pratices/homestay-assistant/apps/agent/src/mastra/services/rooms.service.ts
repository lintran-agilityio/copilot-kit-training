import { z } from "zod";

import { ROUTES } from "@repo/constants";
import {
  availableRoomsResponseSchema,
  GetRoomByNameOutput,
  roomSchema,
  type Room,
} from "@/mastra/schemas/rooms";
import { get } from "@/mastra/services/common";

const getRoomsByNameResponseSchema = z.array(roomSchema);

export const getRooms = async (): Promise<Room[]> => {
  try {
    return await get(`${ROUTES.ROOMS}`, availableRoomsResponseSchema, {
      errorMessage: "Failed to fetch rooms",
    });
  } catch {
    const today = new Date().toISOString().slice(0, 10);
    return getAvailableRooms(today);
  }
};

export const getAvailableRooms = async (date: string): Promise<Room[]> =>
  get(`${ROUTES.ROOMS}`, availableRoomsResponseSchema, {
    searchParams: { date },
    errorMessage: "Failed to fetch available rooms",
  });

export const getRoom = async (roomId: string): Promise<Room> =>
  get(`${ROUTES.ROOMS}/${roomId}`, roomSchema, {
    errorMessage: "Failed to fetch room",
  });

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

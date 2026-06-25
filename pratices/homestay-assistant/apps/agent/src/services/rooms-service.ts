import {
  availableRoomsResponseSchema,
  type Room,
} from "../mastra/schemas/rooms";
import { ROUTES } from "../constants/routes";
import { get } from "./common";

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

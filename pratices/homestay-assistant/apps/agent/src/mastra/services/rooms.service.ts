import { ROUTES } from "@repo/constants";
import {
  roomsListResponseSchema,
  roomSchema,
  type FindRoomInput,
  type FindRoomOutput,
  type Room,
} from "@/mastra/schemas/rooms";
import { get } from "@/mastra/services/common";

/**
 * Fetches all rooms from the API, falling back to today's availability on failure.
 *
 * @returns All rooms, or rooms available today when the unfiltered call fails
 */
export const getRooms = async (): Promise<Room[]> => {
  try {
    return await get(`${ROUTES.ROOMS}`, roomsListResponseSchema, {
      errorMessage: "Failed to fetch rooms",
    });
  } catch {
    const today = new Date().toISOString().slice(0, 10);
    const { rooms } = await findRooms({ date: today });
    return rooms;
  }
};

/**
 * Searches and filters rooms by name, date, guests, and/or level.
 * Empty matches return `{ rooms: [] }` (never throw) so chat tool UI can complete.
 *
 * @param filters - Optional search/filter criteria
 * @returns Matching rooms plus the filters that were applied
 */
export const findRooms = async (
  filters: FindRoomInput = {},
): Promise<FindRoomOutput> => {
  const { name, date, guests, level } = filters;
  const applied = {
    name: name?.trim() || undefined,
    date: date?.trim() || undefined,
    guests,
    level,
  };

  try {
    const rooms = await get(`${ROUTES.ROOMS}`, roomsListResponseSchema, {
      searchParams: applied,
      errorMessage: "Failed to find rooms",
    });

    return {
      rooms: rooms || [],
      ...applied,
    };
  } catch (error) {
    // Older API returned 404 "No rooms found" for empty filters — treat as empty.
    const message = error instanceof Error ? error.message : String(error);
    if (/no rooms found/i.test(message)) {
      return { rooms: [], ...applied };
    }
    throw error;
  }
};

/**
 * Fetches a single room by id.
 *
 * @param roomId - Room identifier
 * @returns Room detail
 */
export const getRoom = async (roomId: string): Promise<Room> =>
  get(`${ROUTES.ROOMS}/${roomId}`, roomSchema, {
    errorMessage: "Failed to fetch room",
  });

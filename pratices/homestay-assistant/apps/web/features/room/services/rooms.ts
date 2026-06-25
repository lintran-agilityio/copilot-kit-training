import type { Room } from "../types/room";

type FetchRoomsOptions = {
  date?: string;
  signal?: AbortSignal;
};

const buildRoomsUrl = (date?: string) =>
  date
    ? `/api/rooms?date=${encodeURIComponent(date)}`
    : "/api/rooms";

export const fetchRooms = async ({
  date,
  signal,
}: FetchRoomsOptions = {}): Promise<Room[]> => {
  const response = await fetch(buildRoomsUrl(date), { signal });

  if (!response.ok) {
    throw new Error("Failed to fetch rooms");
  }

  return (await response.json()) as Room[];
};

export const fetchRoomsByIds = async (
  roomIds: string[],
  signal?: AbortSignal,
): Promise<Room[]> => {
  if (!roomIds.length) {
    return [];
  }

  const idSet = new Set(roomIds);
  const allRooms = await fetchRooms({ signal });

  return allRooms.filter((room) => idSet.has(room.id));
};

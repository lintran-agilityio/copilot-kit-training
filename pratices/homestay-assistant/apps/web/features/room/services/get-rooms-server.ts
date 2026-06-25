import "server-only";

import type { Room } from "@/features/room/types/room";

const getApiUrl = () => process.env.API_URL ?? "http://localhost:5001";

export const getRoomsServer = async (date?: string): Promise<Room[]> => {
  const path = date
    ? `/rooms?date=${encodeURIComponent(date)}`
    : "/rooms";

  const response = await fetch(`${getApiUrl()}${path}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch rooms");
  }

  return (await response.json()) as Room[];
};

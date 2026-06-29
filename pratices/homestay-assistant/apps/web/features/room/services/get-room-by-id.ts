import type { Room } from "@/features/room/types/room";
import { getApiUrl } from "@/utils";

export const getRoomById = async (id: string): Promise<Room> => {
  const response = await fetch(`${getApiUrl()}/rooms/${encodeURIComponent(id)}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch rooms");
  }

  return (await response.json()) as Room;
};

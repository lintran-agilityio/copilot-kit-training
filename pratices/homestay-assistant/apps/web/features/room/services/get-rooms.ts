import type { Room } from "@/features/room/types/room";
import { getApiUrl } from "@/utils";

type GetRoomsProps = {
  configUrl?: string;
  date?: string;
};

export const getRooms = async ({
  configUrl = getApiUrl(),
  date,
}: GetRoomsProps = {}): Promise<Room[]> => {
  const path = date
    ? `/rooms?date=${encodeURIComponent(date)}`
    : "/rooms";

  const response = await fetch(`${configUrl}${path}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch rooms");
  }

  return (await response.json()) as Room[];
};

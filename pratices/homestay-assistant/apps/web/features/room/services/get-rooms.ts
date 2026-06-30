import type { Room } from "@/features/room/types/room";
import { PREFIX_URL } from "@/types";
import { getBaseUrl } from "@/utils";

type GetRoomsProps = {
  via?: PREFIX_URL;
  date?: string;
};

export const getRooms = async ({
  via = PREFIX_URL.BACKEND,
  date,
}: GetRoomsProps = {}): Promise<Room[]> => {
  const path = date
    ? `/rooms?date=${encodeURIComponent(date)}`
    : "/rooms";
  const baseUrl = getBaseUrl(via);

  const response = await fetch(`${baseUrl}${path}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch rooms");
  }

  return (await response.json()) as Room[];
};

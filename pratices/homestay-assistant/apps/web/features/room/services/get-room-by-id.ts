import type { Room } from "@/features/room/types/room";
import { PREFIX_URL } from "@repo/types";
import { getBaseUrl } from "@/utils";
import { ROUTES } from "@repo/constants";

type GetRoomByIdProps = {
  via?: PREFIX_URL;
  roomId: string;
  userId?: string;
};

export const getRoomById = async ({
  via = PREFIX_URL.BACKEND,
  roomId,
  userId,
}: GetRoomByIdProps): Promise<Room> => {
  const baseUrl = getBaseUrl(via);
  const params = new URLSearchParams();

  if (via === PREFIX_URL.BACKEND && userId) {
    params.set("userId", userId);
  }

  const query = params.toString();
  const path = `${ROUTES.ROOMS}/${encodeURIComponent(roomId)}${query ? `?${query}` : ""}`;
  const response = await fetch(`${baseUrl}${path}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch room");
  }

  return (await response.json()) as Room;
};

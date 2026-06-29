import type { Room } from "@/features/room/types/room";
import { getApiUrl } from "@/utils";

type GetRoomByIdProps = {
  configUrl?: string;
  roomId: string;
};

export const getRoomById = async ({
  configUrl = getApiUrl(),
  roomId,
}: GetRoomByIdProps): Promise<Room> => {
  const response = await fetch(`${configUrl}/rooms/${encodeURIComponent(roomId)}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch room");
  }

  return (await response.json()) as Room;
};

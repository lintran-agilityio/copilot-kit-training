import { Room } from "@/features/room/types/room";

export const parseShowRoomDetailResult = (result?: string): Room | undefined => {
  if (!result) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(result) as { room?: Room };
    return parsed.room;
  } catch {
    return undefined;
  }
};

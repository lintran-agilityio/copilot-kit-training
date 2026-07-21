
import type { Room } from "@/features/room/types/room";
import { ToolRendererProps } from "@/features/copilot/types";

export type GetRoomByIdResult = {
  room?: Room | null;
};

export type GetRoomByIdToolProps = ToolRendererProps<GetRoomByIdResult>;
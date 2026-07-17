
import type { Room } from "@/features/room/types/room";
import { ToolRendererProps } from "./tool-render-props";

export type GetRoomByIdResult = {
  room?: Room | null;
};

export type GetRoomByIdToolProps = ToolRendererProps<GetRoomByIdResult>;
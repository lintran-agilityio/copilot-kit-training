import type { Room } from "@/features/room/types/room";
import type { ToolRendererProps } from "@/features/copilot/types";

export type FindRoomResult = {
  rooms?: Room[];
  name?: string;
  date?: string;
  guests?: number;
  level?: number;
};

export type FindRoomToolProps = ToolRendererProps<FindRoomResult>;

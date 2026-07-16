import { ToolCallStatus } from "@copilotkit/react-core/v2";

import type { Room } from "@/features/room/types/room";

export type GetRoomByIdResult = {
  room?: Room | null;
};

export type GetRoomByIdToolProps = {
  status: ToolCallStatus | "inProgress" | "executing" | "complete";
  result?: GetRoomByIdResult | string | null;
};

import { ToolCallStatus } from "@copilotkit/react-core/v2";

/** Only render HITL modals while the tool is actively awaiting user input. */
export const isHitlToolAwaitingUser = (status: ToolCallStatus) =>
  status === ToolCallStatus.Executing;

export const isHitlToolFinished = (status: ToolCallStatus) =>
  status === ToolCallStatus.Complete;

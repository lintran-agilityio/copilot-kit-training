import type { ProcessOutputStreamArgs } from "@mastra/core/processors";
import type { ChunkType, ToolResultPayload } from "@mastra/core/stream";

const ASSISTANT_TEXT_CHUNK_TYPES = [
  "text-delta",
  "text-start",
  "text-end",
] as const;

type AssistantTextChunkType = (typeof ASSISTANT_TEXT_CHUNK_TYPES)[number];

type StreamProcessorState = ProcessOutputStreamArgs["state"];

const isAssistantTextChunkType = (
  type: ChunkType["type"],
): type is AssistantTextChunkType =>
  type === "text-delta" || type === "text-start" || type === "text-end";

/**
 * Shared mechanism behind the "stop after X" stream filters: once a
 * tool-result chunk matches `shouldSuppress`, later assistant text chunks in
 * the run are dropped so a Generic UI card (Room List, bookings list,
 * BookingForm/HITL success) stands as the response instead of being followed
 * by a redundant chat bubble.
 */
export const createSuppressTextAfterToolResultFilter =
  (
    stateKey: string,
    shouldSuppress: (payload: ToolResultPayload) => boolean,
  ) =>
  (part: ChunkType, state: StreamProcessorState): { emit: boolean } => {
    const { type } = part;
    if (type === "tool-result" && shouldSuppress(part.payload)) {
      state[stateKey] = true;
    }

    if (state[stateKey] && isAssistantTextChunkType(type)) {
      return { emit: false };
    }

    return { emit: true };
  };

export type StreamChunkLike = {
  type: string;
  payload?: unknown;
};

export const asToolResultPayload = <TPayload extends object>(
  payload: unknown,
): TPayload =>
  (payload && typeof payload === "object" ? payload : {}) as TPayload;

const isAssistantTextChunkType = (type: string) =>
  type === "text-delta" || type === "text-start" || type === "text-end";

/**
 * Shared mechanism behind the "stop after X" stream filters: once a
 * tool-result chunk matches `shouldSuppress`, later assistant text chunks in
 * the run are dropped so a Generic UI card (Room List, bookings list,
 * BookingForm/HITL success) stands as the response instead of being followed
 * by a redundant chat bubble.
 */
export const createSuppressTextAfterToolResultFilter =
  <TPayload extends object>(
    stateKey: string,
    shouldSuppress: (payload: TPayload) => boolean,
  ) =>
  (
    part: StreamChunkLike,
    state: Record<string, unknown>,
  ): { emit: boolean } => {
    if (part.type === "tool-result") {
      if (shouldSuppress(asToolResultPayload<TPayload>(part.payload))) {
        state[stateKey] = true;
      }
    }

    if (state[stateKey] === true && isAssistantTextChunkType(part.type)) {
      return { emit: false };
    }

    return { emit: true };
  };

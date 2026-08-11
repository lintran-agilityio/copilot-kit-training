import type { ProcessInputStepResult } from "@mastra/core/processors";

/**
 * prepareStep result for a terminal business hop that still needs one guest-facing
 * text reply: forbid further tool calls so the model cannot re-execute the completed
 * operation (MessageMerger would append another large tool part onto the same
 * assistant message).
 *
 * Prefer this over `undefined` after terminal success — `undefined` restores the
 * full default tool set and enables self-loops.
 */
export const narrationOnlyStep = (): ProcessInputStepResult => ({
  activeTools: [],
  toolChoice: "none",
});

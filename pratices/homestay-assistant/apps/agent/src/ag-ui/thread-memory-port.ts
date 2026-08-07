import type { RequestContext } from "@mastra/core/request-context";

import type { MastraAgentLike } from "./types";

/**
 * Small port so AG-UI stream wiring does not import Mastra memory loaders.
 * CopilotKit BFF injects the concrete loaders at `enableProcessorTripwireHandling`.
 */
export type ThreadMemoryPort = {
  loadBlockedMessageIds: (args: {
    mastraAgent: MastraAgentLike | null | undefined;
    threadId: string;
    requestContext?: RequestContext;
  }) => Promise<string[]>;

  loadResolvedToolCallIds: (args: {
    mastraAgent: MastraAgentLike | null | undefined;
    threadId: string;
    resourceId: string | undefined;
    requestContext?: RequestContext;
  }) => Promise<ReadonlySet<string>>;
};

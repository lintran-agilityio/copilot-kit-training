import type { RequestContext } from "@mastra/core/request-context";

export type AgUiToolCall = {
  id?: string;
};

export type AgUiMessage = {
  id?: string;
  role?: string;
  metadata?: unknown;
  content?: unknown;
  toolCalls?: AgUiToolCall[];
  toolCallId?: string;
};

export type MastraAgentLike = {
  getMemory?: (args: {
    requestContext?: RequestContext;
  }) => Promise<{
    getThreadById?: (args: { threadId: string }) => Promise<{
      title?: string;
      metadata?: Record<string, unknown>;
    } | null>;
    updateThread?: (args: {
      id: string;
      title: string;
      metadata: Record<string, unknown>;
    }) => Promise<unknown>;
  } | null>;
  stream?: (
    messages: unknown,
    options?: Record<string, unknown>,
  ) => Promise<unknown>;
  abortRunStream?: (runId: string) => boolean;
};

export type AgUiRunInput = {
  runId?: string;
  threadId?: string;
  [key: string]: unknown;
};

export type AgUiMastraAgent = {
  resourceId?: string;
  requestContext?: RequestContext;
  agent?: MastraAgentLike | null;
  processFullStream?: (
    stream: AsyncIterable<unknown>,
    callbacks: Record<string, unknown>,
    excludedToolNames?: Set<string>,
    workingMemoryState?: Record<string, unknown>,
  ) => Promise<boolean>;
  streamMastraAgent?: (
    input: {
      threadId: string;
      messages: AgUiMessage[];
    },
    callbacks: Record<string, unknown>,
  ) => Promise<unknown>;
  clone?: () => AgUiMastraAgent;
  run?: (input: AgUiRunInput) => unknown;
  /**
   * AbstractAgent.abortRun is a no-op; Intelligence runner stop relies on it.
   * We override it to abort the Mastra stream via abortSignal (not detachActiveRun,
   * which drops the Phoenix runner socket and surfaces RUNNER_CONNECTION_DROPPED).
   */
  abortRun?: () => void;
};

export type MastraStreamChunk = {
  type?: string;
  payload?: {
    reason?: string;
    processorId?: string;
  };
};

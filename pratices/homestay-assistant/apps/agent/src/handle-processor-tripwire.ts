import { AsyncLocalStorage } from "node:async_hooks";

import type { RequestContext } from "@mastra/core/request-context";
import {
  AGENT_STEP_LIMIT_PROCESSOR_ID,
  THREAD_METADATA_BLOCKED_MESSAGE_IDS,
  formatProcessorBlockAssistantContent,
  isBlockedMessageMetadata,
} from "@repo/constants";

import { loadBlockedMessageIdsForThread } from "@/mastra/processors/blocked-message-ids";
import { REQUEST_CONTEXT_KEYS } from "@/mastra/middleware/constants";

type AgUiMessage = {
  id?: string;
  role?: string;
  metadata?: unknown;
};

type MastraAgentLike = {
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
};

type AgUiMastraAgent = {
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
};

type MastraStreamChunk = {
  type?: string;
  payload?: {
    reason?: string;
    processorId?: string;
  };
};

const patchedAgents = new WeakSet<object>();

export const isBlockedUserMessage = (message: AgUiMessage) =>
  message.role === "user" && isBlockedMessageMetadata(message.metadata);

export const excludeBlockedUserMessages = <T extends AgUiMessage>(
  messages: T[],
): T[] => messages.filter((message) => !isBlockedUserMessage(message));

const findLatestUnblockedUserMessageId = (messages: AgUiMessage[]) => {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];

    if (
      message?.role === "user" &&
      typeof message.id === "string" &&
      !isBlockedUserMessage(message)
    ) {
      return message.id;
    }
  }

  return undefined;
};

async function syncBlockedMessageIdsToRequestContext({
  requestContext,
  blockedMessageIds,
}: {
  requestContext?: RequestContext;
  blockedMessageIds: string[];
}) {
  if (!requestContext) {
    return;
  }

  requestContext.set(
    REQUEST_CONTEXT_KEYS.BLOCKED_MESSAGE_IDS,
    blockedMessageIds,
  );
}

async function resolveBlockedMessageIds({
  mastraAgent,
  threadId,
  requestContext,
  messages,
}: {
  mastraAgent: MastraAgentLike | null | undefined;
  threadId: string;
  requestContext?: RequestContext;
  messages: AgUiMessage[];
}) {
  const blockedMessageIds = new Set(
    await loadBlockedMessageIdsForThread({
      mastraAgent,
      threadId,
      requestContext,
    }),
  );

  for (const message of messages) {
    if (isBlockedUserMessage(message) && typeof message.id === "string") {
      blockedMessageIds.add(message.id);
    }
  }

  return [...blockedMessageIds];
}

const persistBlockedMessageId = async ({
  mastraAgent,
  threadId,
  messageId,
  requestContext,
}: {
  mastraAgent: MastraAgentLike | null | undefined;
  threadId: string;
  messageId: string;
  requestContext?: RequestContext;
}) => {
  if (!mastraAgent?.getMemory) {
    return;
  }

  try {
    const memory = await mastraAgent.getMemory({ requestContext });

    if (!memory?.getThreadById || !memory.updateThread) {
      return;
    }

    const thread = await memory.getThreadById({ threadId });
    const metadata = { ...(thread?.metadata ?? {}) };
    const existing = metadata[THREAD_METADATA_BLOCKED_MESSAGE_IDS];
    const blockedMessageIds = Array.isArray(existing)
      ? existing.filter((value): value is string => typeof value === "string")
      : [];

    if (blockedMessageIds.includes(messageId)) {
      return;
    }

    await memory.updateThread({
      id: threadId,
      title: typeof thread?.title === "string" ? thread.title : "",
      metadata: {
        ...metadata,
        [THREAD_METADATA_BLOCKED_MESSAGE_IDS]: [...blockedMessageIds, messageId],
      },
    });
  } catch (error) {
    console.warn(
      `[ProcessorTripwire] Failed to persist blocked message ${messageId} for thread ${threadId}:`,
      error,
    );
  }
}

async function* interceptTripwireStream(
  stream: AsyncIterable<unknown>,
  onTripwire: (chunk: MastraStreamChunk) => Promise<void>,
) {
  for await (const chunk of stream) {
    const typedChunk = chunk as MastraStreamChunk;

    if (typedChunk?.type === "tripwire") {
      if (typedChunk.payload?.processorId === AGENT_STEP_LIMIT_PROCESSOR_ID) {
        yield chunk;
        continue;
      }

      await onTripwire(typedChunk);
      return;
    }

    yield chunk;
  }
}

export const enableProcessorTripwireHandling = <T extends Record<string, object>>(
  agents: T,
): T => {
  for (const value of Object.values(agents)) {
    const aguiAgent = value as AgUiMastraAgent;

    if (
      !aguiAgent.streamMastraAgent ||
      !aguiAgent.processFullStream ||
      patchedAgents.has(aguiAgent)
    ) {
      continue;
    }

    patchedAgents.add(aguiAgent);

    const originalProcessFullStream =
      aguiAgent.processFullStream.bind(aguiAgent);
    const originalStreamMastraAgent =
      aguiAgent.streamMastraAgent.bind(aguiAgent);

    aguiAgent.processFullStream = async (stream, callbacks, ...rest) => {
      const tripwireContext = tripwireHandlingContext.getStore();

      if (!tripwireContext) {
        return originalProcessFullStream(stream, callbacks, ...rest);
      }

      const interceptedStream = interceptTripwireStream(stream, async (chunk) => {
        const onTextPart = callbacks.onTextPart as
          | ((text: string) => void)
          | undefined;
        const onFinishMessagePart = callbacks.onFinishMessagePart as
          | (() => void)
          | undefined;

        onTextPart?.(formatProcessorBlockAssistantContent());
        onFinishMessagePart?.();

        if (tripwireContext.blockedUserMessageId) {
          await persistBlockedMessageId({
            mastraAgent: aguiAgent.agent,
            threadId: tripwireContext.threadId,
            messageId: tripwireContext.blockedUserMessageId,
            requestContext: aguiAgent.requestContext,
          });

          const currentBlocked = aguiAgent.requestContext?.get(
            REQUEST_CONTEXT_KEYS.BLOCKED_MESSAGE_IDS,
          );
          const blockedSet = new Set<string>(
            Array.isArray(currentBlocked)
              ? currentBlocked.filter(
                  (value): value is string => typeof value === "string",
                )
              : [],
          );
          blockedSet.add(tripwireContext.blockedUserMessageId);
          await syncBlockedMessageIdsToRequestContext({
            requestContext: aguiAgent.requestContext,
            blockedMessageIds: [...blockedSet],
          });
        }

        if (chunk.payload?.reason) {
          console.info(
            `[ProcessorTripwire] Blocked message ${tripwireContext.blockedUserMessageId ?? "unknown"}: ${chunk.payload.reason}`,
          );
        }
      });

      return originalProcessFullStream(
        interceptedStream,
        callbacks,
        ...rest,
      );
    };

    aguiAgent.streamMastraAgent = async (input, callbacks) => {
      const blockedMessageIds = await resolveBlockedMessageIds({
        mastraAgent: aguiAgent.agent,
        threadId: input.threadId,
        requestContext: aguiAgent.requestContext,
        messages: input.messages,
      });

      await syncBlockedMessageIdsToRequestContext({
        requestContext: aguiAgent.requestContext,
        blockedMessageIds,
      });

      const blockedUserMessageId = findLatestUnblockedUserMessageId(
        input.messages,
      );

      return tripwireHandlingContext.run(
        {
          threadId: input.threadId,
          blockedUserMessageId,
        },
        () =>
          originalStreamMastraAgent(
            {
              ...input,
              messages: excludeBlockedUserMessages(input.messages),
            },
            callbacks,
          ),
      );
    };
  }

  return agents;
};

type TripwireHandlingContext = {
  threadId: string;
  blockedUserMessageId?: string;
};

const tripwireHandlingContext =
  new AsyncLocalStorage<TripwireHandlingContext>();

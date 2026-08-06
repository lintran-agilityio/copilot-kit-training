import type { RequestContext } from "@mastra/core/request-context";
import {
  THREAD_METADATA_BOOKING_DRAFT,
  THREAD_METADATA_STRUCTURED_SEARCH_CONTEXT,
} from "@repo/constants";

import {
  clearBookingDraft,
  clearStructuredSearchContext,
  parseBookingDraft,
  readBookingDraft,
  readStructuredSearchContext,
  writeBookingDraft,
  writeStructuredSearchContext,
  type StructuredSearchContext,
} from "@/mastra/booking/booking-draft-context";
import type { BookingDraft } from "@repo/schemas";

type MemoryLike = {
  getThreadById?: (args: { threadId: string }) => Promise<{
    title?: string;
    metadata?: Record<string, unknown>;
  } | null>;
  updateThread?: (args: {
    id: string;
    title: string;
    metadata: Record<string, unknown>;
  }) => Promise<unknown>;
};

type MastraAgentLike = {
  getMemory?: (args: {
    requestContext?: RequestContext;
  }) => Promise<MemoryLike | null>;
};

export const readBookingDraftFromMetadata = (
  metadata: Record<string, unknown> | undefined,
): BookingDraft | null =>
  parseBookingDraft(metadata?.[THREAD_METADATA_BOOKING_DRAFT]);

export const readStructuredSearchContextFromMetadata = (
  metadata: Record<string, unknown> | undefined,
): StructuredSearchContext | null => {
  const value = metadata?.[THREAD_METADATA_STRUCTURED_SEARCH_CONTEXT];
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const date =
    typeof record.date === "string" && record.date.trim()
      ? record.date.trim()
      : null;
  const guests =
    typeof record.guests === "number" &&
    Number.isInteger(record.guests) &&
    record.guests > 0
      ? record.guests
      : null;

  if (!date && guests == null) {
    return null;
  }

  return { date, guests };
};

/**
 * Loads thread Booking Draft + structured search into request context.
 * No-op when request context already has a draft (in-run hops win).
 */
export async function hydrateBookingDraftIntoRequestContext({
  mastraAgent,
  threadId,
  requestContext,
}: {
  mastraAgent: MastraAgentLike | null | undefined;
  threadId: string;
  requestContext?: RequestContext;
}) {
  if (!requestContext || !mastraAgent?.getMemory) {
    return;
  }

  if (readBookingDraft(requestContext)) {
    return;
  }

  try {
    const memory = await mastraAgent.getMemory({ requestContext });
    if (!memory?.getThreadById) {
      return;
    }

    const thread = await memory.getThreadById({ threadId });
    const draft = readBookingDraftFromMetadata(thread?.metadata);
    if (draft) {
      writeBookingDraft(requestContext, draft);
    }

    if (!readStructuredSearchContext(requestContext)) {
      const search = readStructuredSearchContextFromMetadata(thread?.metadata);
      if (search) {
        writeStructuredSearchContext(requestContext, search);
      }
    }
  } catch (error) {
    console.warn(
      `[BookingDraft] Failed to hydrate draft for thread ${threadId}:`,
      error,
    );
  }
}

/**
 * Persists the current request-context draft (and search filters) to thread metadata.
 */
export async function persistBookingDraftToThread({
  mastraAgent,
  threadId,
  requestContext,
}: {
  mastraAgent: MastraAgentLike | null | undefined;
  threadId: string;
  requestContext?: RequestContext;
}) {
  if (!requestContext || !mastraAgent?.getMemory || !threadId) {
    return;
  }

  try {
    const memory = await mastraAgent.getMemory({ requestContext });
    if (!memory?.getThreadById || !memory.updateThread) {
      return;
    }

    const thread = await memory.getThreadById({ threadId });
    const metadata = { ...(thread?.metadata ?? {}) };
    const draft = readBookingDraft(requestContext);
    const search = readStructuredSearchContext(requestContext);

    if (draft) {
      metadata[THREAD_METADATA_BOOKING_DRAFT] = draft;
    } else {
      delete metadata[THREAD_METADATA_BOOKING_DRAFT];
    }

    if (search) {
      metadata[THREAD_METADATA_STRUCTURED_SEARCH_CONTEXT] = search;
    } else {
      delete metadata[THREAD_METADATA_STRUCTURED_SEARCH_CONTEXT];
    }

    await memory.updateThread({
      id: threadId,
      title: typeof thread?.title === "string" ? thread.title : "",
      metadata,
    });
  } catch (error) {
    console.warn(
      `[BookingDraft] Failed to persist draft for thread ${threadId}:`,
      error,
    );
  }
}

/**
 * Clears draft from request context and thread metadata (terminal workflow).
 */
export async function clearBookingDraftEverywhere({
  mastraAgent,
  threadId,
  requestContext,
}: {
  mastraAgent: MastraAgentLike | null | undefined;
  threadId?: string;
  requestContext?: RequestContext;
}) {
  clearBookingDraft(requestContext);
  clearStructuredSearchContext(requestContext);

  if (!threadId || !mastraAgent) {
    return;
  }

  await persistBookingDraftToThread({
    mastraAgent,
    threadId,
    requestContext,
  });
}

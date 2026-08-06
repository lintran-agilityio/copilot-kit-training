import { MastraAgent } from "@ag-ui/mastra";
import type { RequestContext } from "@mastra/core/request-context";
import { AGENT_KEYS } from "@repo/constants";
import { getAgentResourceId } from "@repo/utils";

import {
  enableProcessorTripwireHandling,
  type ThreadMemoryPort,
} from "./ag-ui";
import { loadBlockedMessageIdsForThread } from "@/mastra/processors/blocked-message-ids";
import {
  hydrateBookingDraftIntoRequestContext,
  persistBookingDraftToThread,
} from "@/mastra/processors/booking-draft-thread";
import { runtimeMastra } from "@/mastra/runtime";
import { loadResolvedToolCallIdsForThread } from "@/mastra/utils";

export { runtimeMastra as mastra } from "@/mastra/runtime";
export { latchThreadStop } from "./ag-ui";

type GetCopilotkitAgentsInput = {
  userId: string;
  agentId?: string;
  requestContext?: RequestContext;
};

/** Mastra memory loaders — injected into AG-UI so the bridge stays free of `@/mastra` imports. */
const threadMemoryPort: ThreadMemoryPort = {
  loadBlockedMessageIds: loadBlockedMessageIdsForThread,
  loadResolvedToolCallIds: loadResolvedToolCallIdsForThread,
  hydrateBookingDraft: hydrateBookingDraftIntoRequestContext,
  persistBookingDraft: persistBookingDraftToThread,
};

/**
 * CopilotKit BFF entry: adapt local Mastra agents to AG-UI.
 * Business tools / prompts stay in Mastra; this layer only bridges transport.
 */
export const getCopilotkitAgents = ({
  userId,
  agentId = AGENT_KEYS.MANAGE_ASSISTANT,
  requestContext,
}: GetCopilotkitAgentsInput) =>
  enableProcessorTripwireHandling(
    MastraAgent.getLocalAgents({
      mastra: runtimeMastra,
      resourceId: getAgentResourceId(userId, agentId),
      requestContext,
    }),
    threadMemoryPort,
  );

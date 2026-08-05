import { MastraAgent } from "@ag-ui/mastra";
import type { RequestContext } from "@mastra/core/request-context";
import { AGENT_KEYS } from "@repo/constants";
import { getAgentResourceId } from "@repo/utils";

import { enableProcessorTripwireHandling } from "./ag-ui";
import { runtimeMastra } from "@/mastra/runtime";

export { runtimeMastra as mastra } from "@/mastra/runtime";
export { latchThreadStop } from "./ag-ui";

type GetCopilotkitAgentsInput = {
  userId: string;
  agentId?: string;
  requestContext?: RequestContext;
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
  );

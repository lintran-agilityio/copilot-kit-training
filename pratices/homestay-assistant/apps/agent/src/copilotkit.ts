import { MastraAgent } from "@ag-ui/mastra";
import type { RequestContext } from "@mastra/core/request-context";
import { AGENT_KEYS } from "@repo/constants";
import { getAgentResourceId } from "@repo/utils";

import { enableProcessorTripwireHandling } from "./handle-processor-tripwire";
import { runtimeMastra } from "@/mastra/runtime";

export { runtimeMastra as mastra } from "@/mastra/runtime";
export { latchThreadStop } from "./handle-processor-tripwire";

type GetCopilotkitAgentsInput = {
  userId: string;
  agentId?: string;
  requestContext?: RequestContext;
};

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

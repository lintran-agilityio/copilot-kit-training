import type { RequestContext } from "@mastra/core/request-context";
import { MastraAgent } from "@ag-ui/mastra";
import { AGENT_KEYS } from "@repo/constants";
import { getAgentResourceId } from "@repo/utils";

import { enableSuggestionToolChoice } from "./enable-suggestion-tool-choice";
import { runtimeMastra } from "@/mastra/runtime";
import { createAgentRequestContext } from "@/mastra/utils/request-context";

export { runtimeMastra as mastra } from "@/mastra/runtime";
export { createAgentRequestContext };

export const getCopilotkitAgents = (
  userId: string,
  requestContext?: RequestContext,
) => {
  const resolvedContext =
    requestContext ?? createAgentRequestContext({ userId });

  return enableSuggestionToolChoice(
    MastraAgent.getLocalAgents({
      mastra: runtimeMastra,
      resourceId: getAgentResourceId(userId, AGENT_KEYS.MANAGE_ASSISTANT),
      requestContext: resolvedContext,
    }),
  );
};

import { MastraAgent } from "@ag-ui/mastra";
import { AGENT_KEYS } from "@repo/constants";
import { getAgentResourceId } from "@repo/utils";

import { runtimeMastra } from "./mastra/runtime";

export { runtimeMastra as mastra } from "./mastra/runtime";

export const getCopilotkitAgents = (userId: string) =>
  MastraAgent.getLocalAgents({
    mastra: runtimeMastra,
    resourceId: getAgentResourceId(userId, AGENT_KEYS.HOMESTAY_ASSISTANT),
  });

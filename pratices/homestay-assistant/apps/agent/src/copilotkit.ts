import { MastraAgent } from "@ag-ui/mastra";
import { Mastra } from "@mastra/core/mastra";

import { AGENT_KEYS } from "@repo/constants";

import { homestayAgent } from "./mastra/agents/homestay-agent";

export const mastra = new Mastra({
  agents: {
    [AGENT_KEYS.HOMESTAY_ASSISTANT]: homestayAgent,
  },
});

export const copilotkitAgents = MastraAgent.getLocalAgents({
  mastra,
  resourceId: "default",
});

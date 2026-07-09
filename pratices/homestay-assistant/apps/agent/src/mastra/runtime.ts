import { Mastra } from "@mastra/core/mastra";
import { LibSQLStore } from "@mastra/libsql";
import { AGENT_KEYS } from "@repo/constants";

import { manageAgent } from "@/mastra/agents/manage-agent";
import { runtimeDbPath } from "@/mastra/db-paths";

export const runtimeMastra = new Mastra({
  agents: {
    [AGENT_KEYS.MANAGE_ASSISTANT]: manageAgent,
  },
  storage: new LibSQLStore({
    id: "mastra-runtime-storage",
    url: `file:${runtimeDbPath}`,
  }),
});

export { runtimeMastra as mastra };

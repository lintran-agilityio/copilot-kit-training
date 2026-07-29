import { Mastra } from "@mastra/core/mastra";
import { LibSQLStore } from "@mastra/libsql";
import { AGENT_KEYS } from "@repo/constants";

import { manageAgent } from "@/mastra/agents/manage-agent";
import { suggestionAgent } from "@/mastra/agents/suggestion-agent";
import { studioDbPath } from "@/mastra/db-paths";
import {
  createMastraServerAuthConfig,
  createMastraServerMiddleware,
} from "@/mastra/middleware";

export const runtimeMastra = new Mastra({
  agents: {
    [AGENT_KEYS.MANAGE_ASSISTANT]: manageAgent,
    [AGENT_KEYS.SUGGESTION_ASSISTANT]: suggestionAgent,
  },
  storage: new LibSQLStore({
    id: "mastra-runtime-storage",
    url: `file:${studioDbPath}`,
  }),
  server: {
    middleware: createMastraServerMiddleware(),
    auth: createMastraServerAuthConfig(),
  },
});

export { runtimeMastra as mastra };

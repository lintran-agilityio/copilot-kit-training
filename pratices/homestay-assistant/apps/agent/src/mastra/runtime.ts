import { Mastra } from "@mastra/core/mastra";
import { LibSQLStore } from "@mastra/libsql";
import { AGENT_KEYS } from "@repo/constants";

import { manageAgent } from "@/mastra/agents/manage-agent";
import { runtimeDbPath } from "@/mastra/db-paths";
import {
  createMastraServerAuthConfig,
  createMastraServerMiddleware,
} from "@/mastra/middleware";

/**
 * Lean Mastra for CopilotKit BFF / AG-UI.
 * Owns agents + runtime LibSQL only — no Studio observability stack.
 */
export const runtimeMastra = new Mastra({
  agents: {
    [AGENT_KEYS.MANAGE_ASSISTANT]: manageAgent,
  },
  storage: new LibSQLStore({
    id: "mastra-runtime-storage",
    url: `file:${runtimeDbPath}`,
  }),
  server: {
    middleware: createMastraServerMiddleware(),
    auth: createMastraServerAuthConfig(),
  },
});

export { runtimeMastra as mastra };

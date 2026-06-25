import { Mastra } from "@mastra/core/mastra";
import { LibSQLStore } from "@mastra/libsql";
import { AGENT_KEYS } from "@repo/constants";

import { homestayAgent } from "./agents/homestay-agent";
import { runtimeDbPath } from "./db-paths";

export const mastraDbPath = runtimeDbPath;

export const runtimeMastra = new Mastra({
  agents: { [AGENT_KEYS.HOMESTAY_ASSISTANT]: homestayAgent },
  storage: new LibSQLStore({
    id: "mastra-storage",
    url: `file:${mastraDbPath}`,
  }),
});

export { runtimeMastra as mastra };

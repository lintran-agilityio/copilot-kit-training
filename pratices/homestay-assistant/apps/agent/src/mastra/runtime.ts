import path from "node:path";
import { fileURLToPath } from "node:url";

import { Mastra } from "@mastra/core/mastra";
import { LibSQLStore } from "@mastra/libsql";
import { AGENT_KEYS } from "@repo/constants";

import { homestayAgent } from "./agents/homestay-agent";

export const mastraDbPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../mastra.db",
);

export const runtimeMastra = new Mastra({
  agents: { [AGENT_KEYS.HOMESTAY_ASSISTANT]: homestayAgent },
  storage: new LibSQLStore({
    id: "mastra-storage",
    url: `file:${mastraDbPath}`,
  }),
});

export { runtimeMastra as mastra };

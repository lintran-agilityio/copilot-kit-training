import path from "node:path";
import { fileURLToPath } from "node:url";

const agentRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

/** LibSQL file used by `mastra dev` / `mastra start` (agent owns thread storage). */
export const runtimeDbPath = path.join(agentRoot, "mastra.db");

/** Legacy Studio-only path (unused when agent is the sole Mastra process). */
export const studioDbPath = path.join(agentRoot, "mastra-studio.db");

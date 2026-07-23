import path from "node:path";
import { fileURLToPath } from "node:url";

const agentRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

/** Used by the Next.js app (embedded CopilotKit runtime). */
export const runtimeDbPath = path.join(agentRoot, "mastra.db");

/** Used by `mastra dev` / Studio — separate file avoids SQLite lock contention with the web app. */
export const studioDbPath = path.join(agentRoot, "mastra-studio.db");

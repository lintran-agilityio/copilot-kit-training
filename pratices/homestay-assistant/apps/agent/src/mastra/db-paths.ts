import path from "node:path";
import { fileURLToPath } from "node:url";

const agentRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

/** Shared LibSQL file for `mastra dev` / `mastra start` and web thread reads. */
export const runtimeDbPath = path.join(agentRoot, "mastra.db");

/** Legacy Studio-only path (unused when agent is the sole Mastra process). */
export const studioDbPath = path.join(agentRoot, "mastra-studio.db");

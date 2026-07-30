import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const agentRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

const dataDir = path.resolve(
  process.env.MASTRA_DATA_DIR ?? path.join(agentRoot, "src/mastra/public"),
);

fs.mkdirSync(dataDir, { recursive: true });

export const studioDbPath = path.join(dataDir, "mastra.db");
export const duckDbPath = path.join(dataDir, "mastra.duckdb");
console.log('MASTRA DB PATHS', {
  cwd: process.cwd(),
  studioDbPath,
  exists: fs.existsSync(studioDbPath),
});

console.log('MASTRA DATA DIR', process.env.MASTRA_DATA_DIR);


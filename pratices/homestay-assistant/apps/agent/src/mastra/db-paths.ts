import path from "node:path";
import fs from "node:fs";

const dataDir =
  process.env.MASTRA_DATA_DIR ??
  path.join(process.cwd(), "src/mastra/public");

fs.mkdirSync(dataDir, { recursive: true });

export const studioDbPath = path.join(dataDir, "mastra.db");
export const duckDbPath = path.join(dataDir, "mastra.duckdb");
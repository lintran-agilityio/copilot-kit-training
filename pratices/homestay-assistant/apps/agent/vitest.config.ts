import path from "node:path";
import { defineConfig } from "vitest/config";

/**
 * Evalite runs on Vitest under the hood but exposes no plugin/alias hook of
 * its own (`Evalite.Config` has no `plugins`/`resolve` field) — Vitest's
 * `createVitest` still auto-discovers a `vitest.config.ts` in the project
 * root, though, so this file exists solely to mirror tsconfig.json's `@/*`
 * path alias for the eval runner. It is not used by `mastra dev`/`build`
 * (those go through the Mastra CLI's own bundler) or by `pnpm test` (plain
 * `tsx`) — only by `evalite run|watch`.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});

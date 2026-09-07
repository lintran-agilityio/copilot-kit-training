import path from "node:path";
import { defineConfig } from "vitest/config";

/**
 * Evalite runs on Vitest under the hood but exposes no plugin/alias hook of
 * its own (`Evalite.Config` has no `plugins`/`resolve` field) — Vitest's
 * `createVitest` still auto-discovers a `vitest.config.ts` in the project
 * root, though, so this file exists to mirror tsconfig.json's `@/*` path
 * alias for the eval runner and to pin its execution model. It is not used
 * by `mastra dev`/`build` (those go through the Mastra CLI's own bundler) or
 * by `pnpm test` (plain `tsx`) — only by `evalite run|watch`.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    /**
     * `evalite.config.ts`'s `maxConcurrency: 1` only serializes cases *within*
     * one `.eval.ts` file — Vitest still runs the ~10 behavioral eval files in
     * parallel worker processes by default. Each behavioral case is a real
     * multi-call agent turn (prompt-injection detector + tool loop, ~30k
     * tokens each on gpt-4o-mini), so several files at once jointly blow the
     * OpenAI 200k TPM budget and Mastra's built-in "rate limit approaching"
     * backoff can't pace a run it only sees one worker's slice of. Running the
     * files one at a time lets that backoff actually keep the whole suite
     * under the per-minute cap. Evalite forces `testTimeout`, `maxConcurrency`
     * and `setupFiles` but leaves `fileParallelism` to us.
     */
    fileParallelism: false,
  },
});

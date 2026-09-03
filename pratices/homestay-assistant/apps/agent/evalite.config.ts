import { defineConfig } from "evalite/config";
import { createInMemoryStorage } from "evalite/in-memory-storage";

/**
 * Evalite's default storage backend (`better-sqlite3`) needs a native binding
 * that is not prebuilt for every dev/CI machine in this monorepo — evaluating
 * requires no persistent cross-run history (each `eval` run is judged on its
 * own pass/fail + score), so in-memory storage sidesteps that native
 * dependency entirely. Local score history across runs (the Evalite UI's
 * "vs previous run" diff) is the only feature this gives up.
 */
export default defineConfig({
  storage: () => createInMemoryStorage(),
  // Fixtures stub `globalThis.fetch` for the duration of one case
  // (evals/support/fake-api.ts) — evalite's default concurrency (5) would
  // let two cases' install/restore race on that single global and leak the
  // real network into a case still mid-flight. Serializing eval cases is the
  // simple, correct fix; the alternative (AsyncLocalStorage-scoped fetch)
  // isn't worth the complexity for a suite this size.
  maxConcurrency: 1,
  // Agent turns are real LLM calls through the full tool-loop (search →
  // availability → confirm, etc.), and the OpenAI key used in development
  // hits per-minute token throttling that adds ~10s backoff waits on top —
  // observed multi-step cases exceeding 60s under throttling. 120s gives
  // real headroom without letting a genuinely hung call run forever.
  testTimeout: 120_000,
});

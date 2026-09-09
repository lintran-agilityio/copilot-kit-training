/**
 * Global pacing gate for the eval suite's real model calls.
 *
 * The suite is already fully serial — `evalite.config.ts` sets
 * `maxConcurrency: 1` (cases within a file) and `vitest.config.ts` sets
 * `fileParallelism: false` (the files themselves) — yet a fresh
 * `evalite serve` deploy on Render still dies with
 *
 *   429 Rate limit reached for gpt-4o-mini ... on tokens per min (TPM):
 *   Limit 200000, Used 200000, Requested 28562. Please try again in 8.568s.
 *
 * because ~24 back-to-back agent turns (each a multi-call tool loop, plus the
 * prompt-injection detector call, plus a judge call for `response-quality`)
 * sustain well over 150k tokens/min, and short turns landing together burst
 * past OpenAI's org-wide 200k TPM cap. Mastra's own `maxRetries: 2` runs out
 * while the org sits pinned at the limit, so the turn throws.
 *
 * This file is wired in through `evalite.config.ts` `setupFiles`, so it runs
 * once per test worker in EVERY mode — `eval`, `eval:watch`, and the
 * `eval:serve` process Render starts. It wraps `globalThis.fetch` once and,
 * for model-provider hosts only:
 *
 *   1. paces requests through a trailing-60s token budget
 *      (`EVAL_TPM_BUDGET`, default 150_000) — the cost of a call is estimated
 *      from its request body, and the budget is shared across the run's
 *      sequential worker forks via a small JSON ledger on disk;
 *   2. on a 429, honors `Retry-After` / the `x-ratelimit-reset-tokens`
 *      header / "try again in Xs" and retries up to `EVAL_RATE_LIMIT_RETRIES`
 *      (default 6) times, so a transient overage never surfaces as a failure.
 *
 * Fixture requests never reach this wrapper: `support/fake-api.ts` installs
 * its own `globalThis.fetch` per case that short-circuits its own origin and
 * delegates everything else to the fetch it captured — which is this one.
 *
 * Set `EVAL_TPM_BUDGET=0` to disable pacing (the 429 retry stays active).
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const PROVIDER_HOSTS = ["api.openai.com", "openrouter.ai", "api.cerebras.ai"];

const WINDOW_MS = 60_000;
const TPM_BUDGET = Number(process.env.EVAL_TPM_BUDGET ?? 150_000);
const MAX_RETRIES = Math.max(
  0,
  Number(process.env.EVAL_RATE_LIMIT_RETRIES ?? 6) || 0,
);
const LEDGER_PATH =
  process.env.EVAL_TPM_LEDGER ??
  join(process.env.MASTRA_DATA_DIR || tmpdir(), "evalite-tpm-ledger.json");

/** `[epochMs, tokens]` — entries older than the window are pruned on read. */
type LedgerEntry = [number, number];

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, Math.max(0, ms)));

const readLedger = (): LedgerEntry[] => {
  try {
    const parsed = JSON.parse(readFileSync(LEDGER_PATH, "utf8")) as LedgerEntry[];
    const cutoff = Date.now() - WINDOW_MS;
    return Array.isArray(parsed)
      ? parsed.filter((entry) => Array.isArray(entry) && entry[0] >= cutoff)
      : [];
  } catch {
    return [];
  }
};

const writeLedger = (entries: LedgerEntry[]): void => {
  try {
    mkdirSync(dirname(LEDGER_PATH), { recursive: true });
    writeFileSync(LEDGER_PATH, JSON.stringify(entries));
  } catch {
    // Best effort: without the ledger we simply lose cross-fork pacing memory.
  }
};

const estimateTokens = (init?: RequestInit): number => {
  const FALLBACK = 12_000;
  const body = init?.body;
  if (typeof body !== "string") return FALLBACK;
  try {
    const parsed = JSON.parse(body) as {
      messages?: unknown;
      input?: unknown;
      max_tokens?: number;
      max_completion_tokens?: number;
    };
    const promptChars = JSON.stringify(
      parsed.messages ?? parsed.input ?? "",
    ).length;
    const reservedOutput = Number(
      parsed.max_tokens ?? parsed.max_completion_tokens ?? 2_048,
    );
    return Math.ceil(promptChars / 4) + reservedOutput;
  } catch {
    return FALLBACK;
  }
};

/** Block until this request fits under the trailing-60s token budget. */
const acquireBudget = async (estimate: number): Promise<void> => {
  if (!(TPM_BUDGET > 0)) return;
  // A single call larger than the whole budget must not deadlock the gate.
  const reserve = Math.min(estimate, TPM_BUDGET);
  for (;;) {
    const entries = readLedger();
    const used = entries.reduce((total, [, tokens]) => total + tokens, 0);
    if (entries.length === 0 || used + reserve <= TPM_BUDGET) {
      entries.push([Date.now(), estimate]);
      writeLedger(entries);
      return;
    }
    const waitMs = entries[0]![0] + WINDOW_MS - Date.now();
    await sleep(Math.min(Math.max(waitMs, 250), WINDOW_MS));
  }
};

// Serialize the gate within a worker so overlapping calls (a scorer's judge
// call vs. the next case's turn) can't both clear the budget check at once.
let gate: Promise<unknown> = Promise.resolve();
const throughGate = <T>(fn: () => Promise<T>): Promise<T> => {
  const run = gate.then(fn, fn);
  gate = run.catch(() => undefined);
  return run;
};

const toUrl = (input: RequestInfo | URL): URL | undefined => {
  try {
    if (typeof input === "string") return new URL(input);
    if (input instanceof URL) return input;
    return new URL((input as Request).url);
  } catch {
    return undefined;
  }
};

const isProviderRequest = (input: RequestInfo | URL): boolean => {
  const url = toUrl(input);
  return url
    ? PROVIDER_HOSTS.some(
        (host) => url.hostname === host || url.hostname.endsWith(`.${host}`),
      )
    : false;
};

const retryAfterMs = (res: Response): number => {
  const header = res.headers.get("retry-after");
  if (header) {
    const seconds = Number(header);
    if (Number.isFinite(seconds)) return seconds * 1_000;
  }
  const resetTokens = res.headers.get("x-ratelimit-reset-tokens");
  const match = resetTokens?.match(/([\d.]+)\s*s/);
  if (match) return Number(match[1]) * 1_000;
  return 10_000;
};

const INSTALLED = Symbol.for("evalite.model-rate-limit.installed");

const install = (): void => {
  const scope = globalThis as Record<PropertyKey, unknown>;
  if (scope[INSTALLED]) return;
  scope[INSTALLED] = true;

  const baseFetch = globalThis.fetch.bind(globalThis);

  const pacedFetch: typeof fetch = async (input, init) => {
    if (!isProviderRequest(input)) return baseFetch(input, init);

    const estimate = estimateTokens(init);

    for (let attempt = 0; ; attempt += 1) {
      await throughGate(() => acquireBudget(estimate));
      const res = await baseFetch(input, init);
      if (res.status !== 429 || attempt >= MAX_RETRIES) return res;

      const waitMs = retryAfterMs(res);
      await res.arrayBuffer().catch(() => undefined);
      console.warn(
        `[eval-rate-limit] 429 from ${
          toUrl(input)?.hostname ?? "provider"
        } — retry ${attempt + 1}/${MAX_RETRIES} in ${Math.round(waitMs)}ms`,
      );
      await sleep(waitMs);
    }
  };

  globalThis.fetch = pacedFetch;
};

install();

/**
 * Provider switch for the homestay assistant's chat model.
 *
 * Two providers are wired:
 * - `openai`   → the app default: stable, no per-minute token cap
 *                (auth via `OPENAI_API_KEY`).
 * - `cerebras` → for exercising the tokens-per-minute rate-limit path in dev
 *                (auth via `CEREBRAS_API_KEY`; the account must have billing
 *                enabled or every call returns 402 Payment Required).
 *
 * Resolution order (first match wins):
 *   1. `AI_MODEL`    – explicit `provider/model` router id; bypasses the switch.
 *   2. `AI_PROVIDER` – `openai` | `cerebras`; selects that provider's slug below.
 *   3. built-in default – `openai`.
 *
 * Tweak a provider's slug without code changes via `OPENAI_MODEL` /
 * `CEREBRAS_MODEL`.
 *
 * Keep every value a router string, not a provider instance: the AI SDK v5
 * providers build a `LanguageModelV4`, which @mastra/core@1 (spec v3) rejects,
 * and only the router path wires provider request/history compat + retries.
 */

export const AI_PROVIDERS = {
  OPENAI: "openai",
  CEREBRAS: "cerebras",
} as const;

export type AiProvider = (typeof AI_PROVIDERS)[keyof typeof AI_PROVIDERS];

const PROVIDER_DEFAULT_MODEL: Record<AiProvider, string> = {
  [AI_PROVIDERS.OPENAI]: process.env.OPENAI_MODEL || "openai/gpt-4o-mini",
  [AI_PROVIDERS.CEREBRAS]: process.env.CEREBRAS_MODEL || "cerebras/gpt-oss-120b",
};

const resolveProvider = (value: string | undefined): AiProvider =>
  value?.trim().toLowerCase() === AI_PROVIDERS.CEREBRAS
    ? AI_PROVIDERS.CEREBRAS
    : AI_PROVIDERS.OPENAI;

/** Active provider (`AI_PROVIDER` env, default `openai`). */
export const AI_PROVIDER: AiProvider = resolveProvider(process.env.AI_PROVIDER);

/** Router id passed to `new Agent({ model })`. */
export const AI_MODEL: string =
  process.env.AI_MODEL?.trim() || PROVIDER_DEFAULT_MODEL[AI_PROVIDER];

/** True when the resolved chat model is Cerebras — drives provider-specific compat. */
export const IS_CEREBRAS_MODEL = AI_MODEL.startsWith(`${AI_PROVIDERS.CEREBRAS}/`);

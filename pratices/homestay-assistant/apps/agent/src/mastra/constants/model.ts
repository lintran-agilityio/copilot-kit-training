/**
 * Provider switch for the homestay assistant's chat model.
 *
 * Three providers are wired:
 * - `openai`     → the app default: stable, no per-minute token cap
 *                  (auth via `OPENAI_API_KEY`).
 * - `cerebras`   → for exercising the tokens-per-minute rate-limit path in dev
 *                  (auth via `CEREBRAS_API_KEY`; the account must have billing
 *                  enabled or every call returns 402 Payment Required).
 * - `openrouter` → routes through openrouter.ai: one key fronts many upstream
 *                  models (auth via `OPENROUTER_API_KEY`). The slug keeps the
 *                  upstream vendor prefix, e.g. `openrouter/openai/gpt-4o-mini`.
 *
 * Resolution order (first match wins):
 *   1. `AI_MODEL`    – explicit `provider/model` router id; bypasses the switch.
 *   2. `AI_PROVIDER` – `openai` | `cerebras` | `openrouter`; selects that
 *                      provider's slug below.
 *   3. built-in default – `openai`.
 *
 * Tweak a provider's slug without code changes via `OPENAI_MODEL` /
 * `CEREBRAS_MODEL` / `OPENROUTER_MODEL`.
 *
 * Keep every value a router string, not a provider instance: the AI SDK v5
 * providers build a `LanguageModelV4`, which @mastra/core@1 (spec v3) rejects,
 * and only the router path wires provider request/history compat + retries.
 */

export const AI_PROVIDERS = {
  OPENAI: "openai",
  CEREBRAS: "cerebras",
  OPENROUTER: "openrouter",
} as const;

export type AiProvider = (typeof AI_PROVIDERS)[keyof typeof AI_PROVIDERS];

const PROVIDER_DEFAULT_MODEL: Record<AiProvider, string> = {
  [AI_PROVIDERS.OPENAI]: process.env.OPENAI_MODEL || "openai/gpt-4o-mini",
  [AI_PROVIDERS.CEREBRAS]: process.env.CEREBRAS_MODEL || "cerebras/gpt-oss-120b",
  [AI_PROVIDERS.OPENROUTER]:
    process.env.OPENROUTER_MODEL || "openrouter/openai/gpt-4o-mini",
};

const KNOWN_PROVIDERS = new Set<string>(Object.values(AI_PROVIDERS));

const resolveProvider = (value: string | undefined): AiProvider => {
  const normalized = value?.trim().toLowerCase() ?? "";
  return KNOWN_PROVIDERS.has(normalized)
    ? (normalized as AiProvider)
    : AI_PROVIDERS.OPENAI;
};

/** Active provider (`AI_PROVIDER` env, default `openai`). */
export const AI_PROVIDER: AiProvider = resolveProvider(process.env.AI_PROVIDER);

/** Router id passed to `new Agent({ model })`. */
export const AI_MODEL: string =
  process.env.AI_MODEL?.trim() || PROVIDER_DEFAULT_MODEL[AI_PROVIDER];

/** True when the resolved chat model is Cerebras — drives provider-specific compat. */
export const IS_CEREBRAS_MODEL = AI_MODEL.startsWith(`${AI_PROVIDERS.CEREBRAS}/`);

/**
 * Model for the prompt-injection detector — always a small hosted classifier,
 * never the primary chat model. A weak/local model is an unreliable injection
 * judge and the detector runs `strategy: "block"`, so every misfire is a
 * user-facing block.
 *
 * Resolution (first match wins):
 *   1. `AI_SECURITY_MODEL` env – explicit override.
 *   2. OpenRouter route – when it's the active provider, or the only hosted
 *      key present (e.g. `AI_PROVIDER` points at a local model with no
 *      `OPENAI_API_KEY`; the check must not fall back to that local model).
 *   3. OpenAI route – `openai/gpt-4o-mini` (needs `OPENAI_API_KEY`; without any
 *      hosted key the detector fails open and allows the message through).
 */
const resolveSecurityModel = (): string => {
  const explicit = process.env.AI_SECURITY_MODEL?.trim();
  if (explicit) {
    return explicit;
  }

  const hasOpenAiKey = Boolean(process.env.OPENAI_API_KEY?.trim());
  const hasOpenRouterKey = Boolean(process.env.OPENROUTER_API_KEY?.trim());

  if (
    AI_PROVIDER === AI_PROVIDERS.OPENROUTER ||
    (!hasOpenAiKey && hasOpenRouterKey)
  ) {
    return "openrouter/openai/gpt-4o-mini";
  }

  return "openai/gpt-4o-mini";
};

export const AI_SECURITY_MODEL: string = resolveSecurityModel();

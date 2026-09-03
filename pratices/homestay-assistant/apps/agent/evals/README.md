# Homestay Assistant — Evals

Evalite-based behavioral evaluations for the Mastra agent in `apps/agent`. This suite tests **AI behavior** — intent routing, tool selection, tool arguments, booking-workflow ordering, response quality, and regressions for previously-fixed bugs. It does **not** test the CopilotKit UI, AG-UI transport, or NestJS API — those have their own test suites (or none yet, in the API's case).

## Why it lives in `apps/agent`

`apps/agent` owns the Mastra agent, its tools, prompts, and the booking step-machine — the actual "AI layer" this suite evaluates. Evalite (`evalite@0.19.0`) and `autoevals` were already listed as devDependencies here (with an `eval:dev` script) before this suite was added; this just fills in the missing eval files, scripts, and config.

## Directory layout

```
evals/
├── deterministic/     no LLM, no network, milliseconds — the free every-PR gate
│   ├── find-room.eval.ts
│   ├── create-booking.eval.ts
│   ├── modify-booking.eval.ts
│   └── cancel-booking.eval.ts
├── <flat *.eval.ts>   real LLM calls, structured (non-judge) scoring
├── response-quality.eval.ts   real LLM calls + an LLM judge per case
├── regression.eval.ts         real LLM calls, one previously-fixed bug per case
└── support/          shared harness — fixtures, fake API, agent harness, scorers, step-contract runner
```

The flat LLM behavioral files (`intent-routing`, `tool-selection`, `tool-arguments`, `booking-workflow`) are **planned** to move into a per-feature `behavioral/` folder mirroring `deterministic/`; that split hasn't happened yet.

## What gets evaluated

| File | Concern | LLM calls? |
|---|---|---|
| `deterministic/find-room.eval.ts` | `find_room` discovery never forces a booking step — search / recommend / internal resolve, or book_resolve with 0 or 2+ matches | **No** |
| `deterministic/create-booking.eval.ts` | CREATE step-machine forced transitions: `find_room(book_resolve)` → Booking Form vs availability, availability → `confirm_booking`, confirmed → `create_booking`, terminal → stop | **No** |
| `deterministic/modify-booking.eval.ts` | The no-op/availability pure functions (`resolveModifyAvailabilityNextAction`, `isSameModifyStay`) **plus** MODIFY step-machine forced transitions: `find_booking_by_id` → modify form vs availability, no-op stays stop, confirmed → `update_booking` | **No** |
| `deterministic/cancel-booking.eval.ts` | CANCEL step-machine forced transitions: cancel dialog confirmed → `cancel_booking`, dismissed → stop, terminal → stop | **No** |
| `intent-routing.eval.ts` | First tool call per canonical intent (search, list bookings, room detail, browse) | Yes |
| `tool-selection.eval.ts` | Resolver-tool choice + required call order for CREATE/MODIFY/CANCEL/room-detail | Yes |
| `tool-arguments.eval.ts` | Exact structured args: guests, normalized dates, never-invented fields | Yes |
| `booking-workflow.eval.ts` | Terminal mutation tool never fires before its confirm gate; no-op MODIFY never opens the confirm dialog | Yes |
| `response-quality.eval.ts` | Rubric-graded reply quality (doesn't invent info, asks for missing info, concise, UI owns room facts) | Yes (+ a judge call per case) |
| `regression.eval.ts` | "show my bookings" vs "available rooms" wording; multi-turn context/token-limiter guard | Yes |

## How to run

```bash
# from apps/agent
pnpm eval:deterministic   # the deterministic/ folder only — no LLM calls, no network, runs in ms
pnpm eval                 # everything — real LLM calls through the real agent, costs tokens
pnpm eval:watch           # watch mode (opens the Evalite UI at localhost:3006)
pnpm check-types          # tsc --noEmit, includes evals/
```

`pnpm eval` and `pnpm eval:watch` invoke `node --env-file-if-exists=.env node_modules/evalite/dist/bin.js run|watch` directly — the `evalite` CLI has no `run`-vs-`watch` env-loading of its own, and `apps/agent` isn't started through `mastra dev` (which loads `.env` itself) for eval runs. `--env-file-if-exists` (not `--env-file`) means a missing `.env` doesn't crash the command — CI is expected to inject `OPENAI_API_KEY` etc. as real environment variables instead of a file.

The `deterministic` / `intent-routing` / etc. argument to `evalite run` is a filename substring filter (Vitest's file filtering) — `evalite run <substring>` only runs `*.eval.ts` files whose path contains that substring. `pnpm eval:deterministic` relies on `deterministic` matching every file under `evals/deterministic/` and nothing outside it (so keep the no-LLM files in that folder and don't put `deterministic` in any other path).

## Required environment variables

Same as running the agent normally (`apps/agent/.env`, see `.env.example`):

- `OPENAI_API_KEY` — required for every non-deterministic eval (the agent's own model calls, plus the LLM judge in `response-quality.eval.ts`, which reuses the same `AI_MODEL` resolution as production — see `src/mastra/constants/model.ts`).
- `API_URL` — read by the harness's fixture layer (`support/fake-api.ts` calls the same `getApiUrl()` production uses) but **no live `apps/api` process needs to be running** — see "How fixtures work" below. It only needs to parse to a valid URL.
- `AI_PROVIDER` / `AI_MODEL` / `CEREBRAS_API_KEY` — optional, same switch as production (`openai` default). Evals were written and validated against the OpenAI path.

No secrets are hardcoded anywhere in this suite.

## How fixtures / test data work

The agent is invoked **directly and in-process** — no CopilotKit, no AG-UI, no HTTP server for the agent itself:

```ts
import { mastra } from "../../src/mastra/runtime"; // the SAME instance apps/web's CopilotKit route uses
const agent = mastra.getAgent(AGENT_KEYS.HOMESTAY_ASSISTANT);
await agent.generate(message, { memory: { thread, resource }, requestContext });
```

`runtime.ts` (not the Studio instance in `mastra/index.ts`) is what `apps/agent/src/copilotkit.ts`'s `getCopilotkitAgents` actually wires up for production traffic, so evaluating it — real prompt, real tools, real input/output processors, real booking step-machine — is what makes these evals faithful without going through AG-UI at all.

Room/booking **data** is a fixed, deterministic dataset (`support/fixtures.ts`) — 3 rooms, 2 bookings, dates chosen to always be in the future relative to whenever the suite runs. Every request the agent's tools would normally send to the NestJS API (`apps/api`) is instead served by a fixture-backed `fetch` stub (`support/fake-api.ts`) that only intercepts requests whose **origin** matches `getApiUrl()` — everything else (the actual OpenAI/Cerebras call, the judge's call) passes straight through to the real network.

**Why mock at `fetch`, not the tools or the agent**: the mock boundary is `apps/agent/src/mastra/services/common.ts`'s `get/post/update/del` — the single chokepoint every room/booking tool goes through to reach apps/api. Stubbing at that boundary means the real tool code, real Zod response parsing, and the real `booking/*` step-machine + availability logic all still execute; only the network hop to a real apps/api process (and whatever's in its database) is replaced. This satisfies "don't over-mock the agent" while keeping evals independent of a running API server or seeded test database.

Auth is faked the same way production's request-pipeline middleware would populate it (`support/agent-harness.ts`): a synthetic Clerk-shaped `MastraAuthContext` is set both on the `RequestContext` passed to `generate()` and via `runWithAgentRequest` (AsyncLocalStorage) — `services/common.ts::resolveAuthForApi` checks the former, falls back to the latter, and evals bypass the HTTP auth middleware entirely (no real Clerk token needed).

### The HITL confirm tools need an explicit stand-in (`support/client-tools.ts`)

`confirm_booking`, `confirm_modify_booking`, `edit_modify_booking`, `show_cancel_dialog_confirm`, and `show_modify_dialog_select` are **not** in `homestayAssistant.tools` at all — they only exist because CopilotKit's `MastraAgent.getLocalAgents()` injects them as client tools from the frontend's `useHumanInTheLoop`/`useRenderTool` registrations. Calling the agent directly (as this suite deliberately does, to stay off AG-UI/CopilotKit) means those tools don't exist unless supplied — and without them, the booking step-machine's forced transition to e.g. `confirm_booking` has nothing to call, so the model falls through to whatever tool IS registered, which turned out to be `create_booking`/`update_booking`/`cancel_booking` itself during initial validation of this suite. That was a harness gap, not a production bug: `support/client-tools.ts` defines the same 5 tools with their real shared schemas (`@repo/schemas`) and no `execute` (deliberately — a client tool with no server-side `execute` is exactly what a real frontend-rendered tool looks like: the call is emitted and the turn ends there, awaiting an out-of-band result), passed via `generate()`'s `clientTools` option. `support/agent-harness.ts::runAgentTurn` wires this in for every eval automatically.

## Concurrency note (important if you add eval files)

`evalite.config.ts` sets `maxConcurrency: 1`. The fixture `fetch` stub is installed on `globalThis.fetch` per case (`support/run-case.ts`) and restored afterward — evalite's default concurrency (5) would let two cases' install/restore race on that one global and leak the real network into a case still mid-flight. Serializing cases is the simple, correct fix for a suite this size; don't raise `maxConcurrency` without also making the fetch stub properly scoped (e.g. per-case `AsyncLocalStorage`).

## Which tests are deterministic vs LLM-judged

- **Fully deterministic, no LLM call at all**: everything under `deterministic/` — the no-op/availability pure functions from `src/mastra/booking/modify-booking.ts`, plus the `resolveEnforcedTransition` step-machine entry point from `src/mastra/booking/step-machine.ts` driven with each tool's own documented result shape (`support/step-contract.ts` is the shared runner; a tiny fake `ProcessInputStepArgs` — `messages` + a real `RequestContext` — is built only for the `find_room(book_resolve)` junction, which corroborates the stated stay against the guest's latest message). No `agent.generate()`, no fixture API, no network.
- **Deterministic assertions over a real LLM-driven agent run**: `intent-routing`, `tool-selection`, `tool-arguments`, `booking-workflow`, and most of `regression` — the *agent's* output is non-deterministic (a real model call), but the *scoring* is a structured assertion (tool name, argument value, call order) — not a semantic judgment. A flaky model response can still fail these; that's the model's routing/argument reliability being tested, not test flakiness.
- **LLM-judged**: `response-quality.eval.ts` only. Every rubric line is a single literal, independently-checkable claim (see `support/judge.ts`) — never an open "does this look good?" — to keep it as low-flake as an LLM judge can reasonably be.

## Adding a new evaluation

1. Pick the file that matches the concern (or add a new `*.eval.ts` file for a new concern — keep one concern per file).
2. Reuse `support/run-case.ts::runCase(message, options?)` for a single agent turn — it installs the fixture API, runs the turn, and always restores `fetch` in a `finally`.
3. Read tool calls off `CaseResult.toolNames` (string[], in order) or `CaseResult.toolCalls` (with args, via `support/tool-calls.ts::toolCallArgs`).
4. Prefer a structured assertion (`support/checks.ts::scoreResult(pass, reason)`) over an LLM judge. Only reach for `support/judge.ts::gradeAgainstRubric` when the thing you're checking is genuinely about natural-language phrasing.
5. If your scenario needs a booking/room that doesn't exist yet, add it to `support/fixtures.ts` rather than inlining ad-hoc data — keeps `fake-api.ts` the single source of truth for what "the database" contains.
6. Pure-function/no-LLM checks belong under `deterministic/` (one file per guest-facing feature) so `pnpm eval:deterministic` picks them up automatically via the folder-path substring filter. Step-machine routing cases go through `support/step-contract.ts::stepContractEval`; direct pure-function cases call `evalite` themselves (see `deterministic/modify-booking.eval.ts` for both in one file).

## Known limitations / open findings

- **COMPARE (`generate_a2ui`) is out of scope.** It's a CopilotKit-side generative-UI tool injected by the AG-UI bridge, not a tool registered on the Mastra agent (`homestay-assistant.ts`'s `tools:` map has no `generate_a2ui` entry) — it isn't reachable from a direct `agent.generate()` call. Testing it would require going through AG-UI/CopilotKit, which is explicitly out of scope for this suite.
- **`resolve_booking_stay` / `resolve_booking_target` are not evaluated.** Per their own doc comments in `packages/constants/tool-keys.ts`, they're "not yet wired into any tool or the step machine" — nothing to evaluate yet.
- **Two categories of currently-failing cases document real discovered production gaps, not eval bugs** — all verified by direct inspection (the underlying prompt sections were read in full, and for the response-quality case the judge's reasoning was inspected directly during triage) before being left in place, per the brief's "clearly separate evaluation-infra issues from production bugs; never silently loosen an assertion to hide a failure":
  - **Room detail by name never completes its documented tool chain** (`intent-routing.eval.ts`, `tool-selection.eval.ts`). `WORKFLOW_DETAIL` documents that a bare "tell me about `<room name>`" / "what amenities does `<room name>` have" request resolves `find_room` → (exactly one match) → `get_room_by_id`. Observed live runs call `find_room` and stop — the chain never completes — and in the amenities case, the reply lists amenities directly in chat, which both `WORKFLOW_FIND` and `WORKFLOW_DETAIL` explicitly forbid ("UI owns the data").
  - **Every observed reply appends a second boilerplate closer** ("Let me know if you need help!" / "Feel free to ask!"), failing the "single short sentence" rubric line in `response-quality.eval.ts` across all 5 cases (0% score). `GENERIC_UI_RENDERING`'s "emit exactly ONE very short plain sentence" rule appears to be a general habit gap, not confined to one workflow.
  
  Both are left **failing on purpose**; do not edit the assertions to make them pass — fixing either is a prompt/behavior change outside this suite's scope.
- **One tool-argument case showed model non-determinism across otherwise-identical runs**: "Extend my Riverside Twin Room booking by 2 nights" (`tool-arguments.eval.ts`) correctly omitted `requestedGuests` in one run and attached an unprompted `requestedGuests: 2` (matching the fixture's *current* value) in another. This didn't change the final outcome in either run (2 already equals the booking's guest count) but is worth watching — it's model sampling variance on a single case, not a reproducible bug, and not something this suite can eliminate short of pinning `temperature: 0` on the production agent (out of scope: that's a production model-settings change).
- **Fixture "today"** is computed at eval-run time (`@repo/utils/date`'s `formatTodayYmd`/`addDaysYmd`/`getBusinessDates` — the same helpers `src/mastra/utils/current-date.ts` uses to build the system prompt's DATE CONTEXT block), not hardcoded — so date-argument assertions stay correct regardless of which day the suite runs. Fixture *booking* dates (`support/fixtures.ts`) are hardcoded to October/November 2026 specifically so they stay comfortably in the future without needing recomputation; revisit if this suite is still in use after those dates pass.
- **`response-quality.eval.ts` costs an extra LLM call per case** (the judge itself calls the model) — keep case counts modest there specifically.
- The historical **MessageMerger/TokenLimiter context-duplication bug** has no live processor named `MessageMerger` to test directly (it's a Mastra-internal class); `regression.eval.ts`'s multi-turn case instead asserts the observable symptom (every turn in a realistic multi-turn conversation, including a repeated `get_bookings` request, completes without a tripwire and without a runaway step count) rather than depending on an internal class or an exact token count. Validated: 5/5 turns complete, max 2 steps/turn.
- **Run eval files one at a time, not concurrently.** Two `evalite run` processes against the same OpenAI key can jointly exceed its per-minute token budget (observed: a 200k TPM limit hit mid-run when two files ran in parallel during this suite's own validation), surfacing as a genuine `429`/timeout failure that has nothing to do with agent correctness. `pnpm eval` (no filter) already runs every file within one process/one `maxConcurrency: 1` queue, so this only matters if you invoke `evalite run <filter>` multiple times yourself.

## CI considerations

There is no CI pipeline in this repository yet (no `.github/workflows`, no other CI config) — this suite doesn't introduce one. If/when CI is added for this repo:

- Run `pnpm eval:deterministic` on every PR — it's free (no API key needed, no network, milliseconds) and catches regressions in the booking step-machine's ordering contract directly.
- Run `pnpm eval` (the full LLM-backed suite) separately from the fast PR gate — it costs real API tokens, takes minutes (the OpenAI free/low tier throttles per-minute tokens; expect `Rate limit approaching, waiting…` pauses), and its non-deterministic-input-deterministic-scoring cases can occasionally fail on model variance even when nothing regressed. A nightly/manual/label-triggered job is more appropriate than a required PR check.
- Either way, always run `pnpm check-types` (typechecks `src/**/*` and `evals/**/*` together) first — it's free and catches the most common eval-authoring mistakes before spending API budget.

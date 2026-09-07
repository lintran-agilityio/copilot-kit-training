# Homestay Assistant — Evals

Evalite-based behavioral evaluations for the Mastra agent in `apps/agent`. This suite tests **AI behavior** — intent routing, tool selection, tool arguments, booking-workflow ordering, response quality, and regressions for previously-fixed bugs. It does **not** test the CopilotKit UI, AG-UI transport, or NestJS API — those have their own test suites (or none yet, in the API's case).

## Why it lives in `apps/agent`

`apps/agent` owns the Mastra agent, its tools, prompts, and the booking step-machine — the actual "AI layer" this suite evaluates. Evalite (`evalite@0.19.0`) and `autoevals` were already listed as devDependencies here (with an `eval:dev` script) before this suite was added.

## Directory layout — per agent, per tool

```
evals/
├── support/                       shared harness — fixtures, fake API, agent harness, scorers, step-contract runner
└── homestay-assistant/            the one agent (a 2nd agent would get a sibling directory)
    ├── deterministic/             no LLM, no network, milliseconds — the free every-PR gate
    │   ├── find-room.eval.ts               find_room result → transition (discovery never forces; book_resolve fork)
    │   ├── create-booking.eval.ts          confirm_booking gate; create_booking terminal → stop
    │   ├── update-booking.eval.ts          picker / edit-form / confirm_modify gates; update_booking → stop
    │   ├── cancel-booking.eval.ts          show_cancel_dialog_confirm gate; cancel_booking → stop
    │   └── find-booking-by-id.eval.ts      find_booking_by_id(modify) junction → edit form vs confirm_modify_booking vs stop (incl. its own availability probe)
    ├── behavioral/                real LLM calls through the real agent — structured (non-judge) scoring
    │   ├── get-rooms.eval.ts               plain catalog browse only
    │   ├── find-room.eval.ts               selection (discovery intent) + arguments (dates/guests/level/limit)
    │   ├── get-room-by-id.eval.ts          detail & [book-form] routing  ⚠️ 2 KNOWN-FAILING cases
    │   ├── create-booking.eval.ts          never mutates before the confirm gate
    │   ├── update-booking.eval.ts          never mutates before confirm; no-op modify never opens the dialog
    │   ├── cancel-booking.eval.ts          resolve by name, stop at the cancel dialog
    │   ├── get-bookings.eval.ts            "show my bookings" routing; onDate discipline
    │   ├── find-bookings.eval.ts           internal resolver, never find_room; not_found is a hard stop
    │   └── find-booking-by-id.eval.ts      MODIFY stated-change extraction; [booking-cancel] trigger
    └── conversation/              agent-level, not per-tool
        ├── response-quality.eval.ts        rubric-graded reply quality  ⚠️ 5 KNOWN-FAILING cases (+ a judge call per case)
        └── multi-turn-context.eval.ts      token-limiter / step-count regression across one thread
```

**Why the split.** `deterministic/` proves the booking step-machine's ordering contract (`src/mastra/utils/step-machine.ts`) with zero API cost, zero network, in milliseconds — run it on every PR. `behavioral/` runs the *same* gates through a real model turn, so a model that stops honoring them fails even though the deterministic gate still passes. `conversation/` is the only place an LLM judge is used, and the only multi-turn scenario.

**Why per tool.** Each registered tool has (at most) one `deterministic/` file and one `behavioral/` file, both named for the tool. To see everything that checks `find_room`, open two files, not five. `get_rooms` / `get_room_by_id` / `get_bookings` / `find_bookings` don't force step-machine transitions, so they have a `behavioral/` file only.

## What gets evaluated — per tool

| Tool | `deterministic/` | `behavioral/` |
|---|---|---|
| `get_rooms` | — | plain browse only; never `find_room` / `get_bookings` for it |
| `find_room` | every result shape → transition; `book_resolve`·1-match → form vs `confirm_booking` (own availability probe) vs stop | discovery intent routes here first; "available" wording never → `get_bookings`; date normalized, guests never invented, `level`/`limit` |
| `get_room_by_id` | *(forced target only — see `find-room.eval.ts`)* | detail chain (⚠️ known-failing); `[book-form]` → `get_room_by_id` only, no availability |
| `create_booking` | `confirm_booking` confirmed→create / dismissed→stop; terminal→stop | never fires before `find_room`→`confirm_booking` (there is no `check_room_availability` tool); full stay skips the form |
| `update_booking` | picker / edit-form / `confirm_modify_booking` gates; terminal→stop | never fires before the confirm gate; no-op modify never opens the dialog |
| `cancel_booking` | `find_bookings`→pass; `show_cancel_dialog_confirm` confirmed→cancel / dismissed→stop; terminal→stop | resolve by name → `find_bookings` → `show_cancel_dialog_confirm`, no `cancel_booking` this turn |
| `get_bookings` | — | "show/list my bookings" routes here, never `find_room`; `onDate` only from a cue in the current message |
| `find_bookings` | *(covered as `cancel-booking.eval.ts`'s `find_bookings`→pass case)* | internal resolver, never `find_room` first; `not_found` → no HITL/mutation |
| `find_booking_by_id` | `find_booking_by_id(modify)`·1-match → edit form vs `confirm_modify_booking` vs stop (it probes availability itself for a stated change); `cancel` → pass | "extend N nights" computes the date, leaves other fields unset; `[booking-cancel]` → `find_booking_by_id` → `show_cancel_dialog_confirm`, no `find_bookings` |

The 5 HITL client tools (`confirm_booking`, `confirm_modify_booking`, `edit_modify_booking`, `show_cancel_dialog_confirm`, `show_modify_dialog_select`) aren't registered on the agent — they're stubbed in `support/client-tools.ts`. Their confirmed/dismissed → next-tool transitions are asserted inside the terminal-tool files they gate (`create-booking` / `update-booking` / `cancel-booking`).

## How to run

```bash
# from apps/agent
pnpm eval:deterministic   # homestay-assistant/deterministic/ only — no LLM, no network, runs in ms
pnpm eval:behavioral      # homestay-assistant/behavioral/ — real LLM calls, structured scoring, costs tokens
pnpm eval:conversation    # homestay-assistant/conversation/ — real LLM calls + a judge call per case
pnpm eval                 # everything
pnpm eval:watch           # watch mode (opens the Evalite UI at localhost:3006)
pnpm check-types          # tsc --noEmit, includes evals/
```

`pnpm eval` and `pnpm eval:watch` invoke `node --env-file-if-exists=.env node_modules/evalite/dist/bin.js run|watch` directly — the `evalite` CLI has no `run`-vs-`watch` env-loading of its own, and `apps/agent` isn't started through `mastra dev` (which loads `.env` itself) for eval runs. `--env-file-if-exists` (not `--env-file`) means a missing `.env` doesn't crash the command — CI is expected to inject `OPENAI_API_KEY` etc. as real environment variables instead of a file.

The `deterministic` / `behavioral` / `conversation` argument to `evalite run` is a **filename substring filter** (Vitest's file filtering) — `evalite run <substring>` only runs `*.eval.ts` files whose path contains that substring. `pnpm eval:deterministic` relies on `deterministic` matching every file under `homestay-assistant/deterministic/` and nothing outside it. Keep each of the three bucket names a unique path segment and don't put one inside another bucket's path.

## Required environment variables

Same as running the agent normally (`apps/agent/.env`, see `.env.example`):

- `OPENAI_API_KEY` — required for every `behavioral/` and `conversation/` eval (the agent's own model calls, plus the LLM judge in `conversation/response-quality.eval.ts`, which reuses the same `AI_MODEL` resolution as production — see `src/mastra/constants/model.ts`).
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

**Why mock at `fetch`, not the tools or the agent**: the mock boundary is `apps/agent/src/mastra/services/common.ts`'s `get/post/update/del` — the single chokepoint every room/booking tool goes through to reach apps/api. Stubbing at that boundary means the real tool code, real Zod response parsing, and the real `booking/*` step-machine + availability logic all still execute; only the network hop to a real apps/api process (and whatever's in its database) is replaced.

Auth is faked the same way production's request-pipeline middleware would populate it (`support/agent-harness.ts`): a synthetic Clerk-shaped `MastraAuthContext` is set both on the `RequestContext` passed to `generate()` and via `runWithAgentRequest` (AsyncLocalStorage) — `services/common.ts::resolveAuthForApi` checks the former, falls back to the latter, and evals bypass the HTTP auth middleware entirely (no real Clerk token needed).

### The HITL confirm tools need an explicit stand-in (`support/client-tools.ts`)

`confirm_booking`, `confirm_modify_booking`, `edit_modify_booking`, `show_cancel_dialog_confirm`, and `show_modify_dialog_select` are **not** in `homestayAssistant.tools` at all — they only exist because CopilotKit's `MastraAgent.getLocalAgents()` injects them as client tools from the frontend's `useHumanInTheLoop`/`useRenderTool` registrations. Calling the agent directly (as this suite deliberately does, to stay off AG-UI/CopilotKit) means those tools don't exist unless supplied — and without them, the booking step-machine's forced transition to e.g. `confirm_booking` has nothing to call, so the model falls through to whatever tool IS registered (which turned out to be `create_booking`/`update_booking`/`cancel_booking` itself during initial validation). That was a harness gap, not a production bug: `support/client-tools.ts` defines the same 5 tools with their real shared schemas (`@repo/schemas`) and no `execute` (deliberately — a client tool with no server-side `execute` is exactly what a real frontend-rendered tool looks like: the call is emitted and the turn ends there, awaiting an out-of-band result), passed via `generate()`'s `clientTools` option. `support/agent-harness.ts::runAgentTurn` wires this in for every eval automatically.

## Concurrency note (important if you add eval files)

Two separate knobs, both set to fully serial:

- `evalite.config.ts` sets `maxConcurrency: 1` — serializes cases *within* one `.eval.ts` file. The fixture `fetch` stub is installed on `globalThis.fetch` per case (`support/run-case.ts`) and restored afterward — evalite's default concurrency (5) would let two cases' install/restore race on that one global and leak the real network into a case still mid-flight. Don't raise `maxConcurrency` without also making the fetch stub properly scoped (e.g. per-case `AsyncLocalStorage`).
- `vitest.config.ts` sets `test.fileParallelism: false` — serializes the *files* themselves. Vitest otherwise runs `.eval.ts` files in parallel workers, and several real agent turns at once jointly exceed the OpenAI 200k TPM budget (each behavioral case ≈ a prompt-injection-detector call + a multi-step tool loop, ~30k tokens on gpt-4o-mini). Running one file at a time lets Mastra's built-in per-minute backoff ("Rate limit approaching, waiting 10 seconds") actually pace the whole suite. Evalite force-sets `testTimeout` / `maxConcurrency` / `setupFiles` but leaves `fileParallelism` to this file.

Net effect: `pnpm eval:behavioral` runs every case strictly one after another. It's slower (expect ~10–20 min for `behavioral/`) but doesn't hit `429 rate_limit_exceeded`.

## Which tests are deterministic vs LLM-judged

- **Fully deterministic, no LLM call at all**: everything under `homestay-assistant/deterministic/` — the no-op/availability pure functions from `src/mastra/utils/modify-booking.ts`, plus the `resolveEnforcedTransition` step-machine entry point from `src/mastra/utils/step-machine.ts` driven with each tool's own documented result shape (`support/step-contract.ts` is the shared runner). No `agent.generate()`, no fixture API, no network.
- **Deterministic assertions over a real LLM-driven agent run**: everything under `homestay-assistant/behavioral/` and the `multi-turn-context` regression — the *agent's* output is non-deterministic (a real model call), but the *scoring* is a structured assertion (tool name, argument value, call order), not a semantic judgment. A flaky model response can still fail these; that's the model's routing/argument reliability being tested, not test flakiness.
- **LLM-judged**: `homestay-assistant/conversation/response-quality.eval.ts` only. Every rubric line is a single literal, independently-checkable claim (see `support/judge.ts`) — never an open "does this look good?" — to keep it as low-flake as an LLM judge can reasonably be.

## Adding a new evaluation

1. Pick the file named for the tool the case is really about — its `deterministic/` file for a no-LLM step-machine/pure-function check, its `behavioral/` file for a real agent turn. Agent-level scenarios that aren't about one tool (reply wording, multi-turn) go in `conversation/`.
2. Reuse `support/run-case.ts::runCase(message, options?)` for a single agent turn — it installs the fixture API, runs the turn, and always restores `fetch` in a `finally`.
3. Read tool calls off `CaseResult.toolNames` (string[], in order) or `CaseResult.toolCalls` (with args, via `support/tool-calls.ts::toolCallArgs`).
4. Prefer a structured assertion (`support/checks.ts::scoreResult(pass, reason)`) over an LLM judge. Only reach for `support/judge.ts::gradeAgainstRubric` when the thing you're checking is genuinely about natural-language phrasing.
5. If your scenario needs a booking/room that doesn't exist yet, add it to `support/fixtures.ts` rather than inlining ad-hoc data — keeps `fake-api.ts` the single source of truth for what "the database" contains.
6. No-LLM step-machine routing cases go through `support/step-contract.ts::stepContractEval`; direct pure-function cases call `evalite` themselves. Keep them under `deterministic/` so `pnpm eval:deterministic` picks them up via the folder-path substring filter.

## Known limitations / open findings

- **COMPARE (`generate_a2ui`) is out of scope.** It's a CopilotKit-side generative-UI tool injected by the AG-UI bridge, not a tool registered on the Mastra agent (`homestay-assistant.ts`'s `tools:` map has no `generate_a2ui` entry) — it isn't reachable from a direct `agent.generate()` call. Testing it would require going through AG-UI/CopilotKit, which is explicitly out of scope for this suite.
- **`resolve_booking_stay` / `resolve_booking_target` are not evaluated.** Per their own doc comments in `packages/constants/tool-keys.ts`, they're "not yet wired into any tool or the step machine" — nothing to evaluate yet.
- **Two categories of currently-failing cases document real discovered production gaps, not eval bugs** — all verified by direct inspection before being left in place, per "clearly separate evaluation-infra issues from production bugs; never silently loosen an assertion to hide a failure":
  - **Room detail by name never completes its documented tool chain** (`behavioral/get-room-by-id.eval.ts` — 2 cases, marked `knownFailing`). `WORKFLOW_DETAIL` documents that a bare "tell me about `<room name>`" / "what amenities does `<room name>` have" request resolves `find_room` → (exactly one match) → `get_room_by_id`. Observed live runs call `find_room` and stop; in the amenities case the reply also lists amenities directly in chat, which both `WORKFLOW_FIND` and `WORKFLOW_DETAIL` explicitly forbid ("UI owns the data").
  - **Every observed reply appends a second boilerplate closer** ("Let me know if you need help!" / "Feel free to ask!"), failing the "single short sentence" rubric line in `conversation/response-quality.eval.ts` across all 5 cases. `GENERIC_UI_RENDERING`'s "emit exactly ONE very short plain sentence" rule appears to be a general habit gap, not confined to one workflow.

  Both are left **failing on purpose**; do not edit the assertions to make them pass — fixing either is a prompt/behavior change outside this suite's scope.
- **One tool-argument case showed model non-determinism across otherwise-identical runs**: "Extend my Riverside Twin Room booking by 2 nights" (`behavioral/find-booking-by-id.eval.ts`) correctly omitted `requestedGuests` in one run and attached an unprompted `requestedGuests: 2` (matching the fixture's *current* value) in another. This didn't change the final outcome in either run (2 already equals the booking's guest count) but is worth watching — it's model sampling variance, not a reproducible bug.
- **MODIFY availability has no tool step.** `find_booking_by_id(purpose:"modify")` probes `/bookings/availability` itself for a stated change (merging the stated value, excluding the booking) and attaches `availability` / `stayUnchanged`; the no-stated-change path checks client-side in the `edit_modify_booking` form. The step machine then forces `confirm_modify_booking` or stops — proven without an LLM in `deterministic/find-booking-by-id.eval.ts`. There is no `check_room_availability` tool.
- **Fixture "today"** is computed at eval-run time (`@repo/utils/date`'s `formatTodayYmd`/`addDaysYmd`/`getBusinessDates` — the same helpers `src/mastra/utils/current-date.ts` uses), not hardcoded — so date-argument assertions stay correct regardless of which day the suite runs. Fixture *booking* dates (`support/fixtures.ts`) are hardcoded to October/November 2026 so they stay comfortably in the future; revisit if this suite is still in use after those dates pass.
- **`conversation/response-quality.eval.ts` costs an extra LLM call per case** (the judge itself calls the model) — keep case counts modest there specifically.
- The historical **MessageMerger/TokenLimiter context-duplication bug** has no live processor named `MessageMerger` to test directly (it's a Mastra-internal class); `conversation/multi-turn-context.eval.ts` instead asserts the observable symptom (every turn in a realistic multi-turn conversation, including a repeated `get_bookings` request, completes without a tripwire and without a runaway step count).
- **Don't launch two `evalite run` processes at once.** Within one process, `test.fileParallelism: false` (`vitest.config.ts`) + `maxConcurrency: 1` (`evalite.config.ts`) already make every case strictly sequential, so `pnpm eval` / `pnpm eval:behavioral` stay under the OpenAI per-minute token budget on their own. But two separate `evalite run` invocations against the same key still race each other into a 200k TPM limit — run them back to back, not in parallel. To run a single file, pass one path substring as the filter: `pnpm eval behavioral/find-room` (the CLI takes exactly one positional, so `pnpm eval:behavioral find-room` — two positionals — is rejected).

## CI considerations

There is no CI pipeline in this repository yet (no `.github/workflows`, no other CI config) — this suite doesn't introduce one. If/when CI is added:

- Run `pnpm eval:deterministic` on every PR — it's free (no API key, no network, milliseconds) and catches regressions in the booking step-machine's ordering contract directly.
- Run `pnpm eval:behavioral` / `pnpm eval:conversation` separately from the fast PR gate — they cost real API tokens, take minutes (the OpenAI free/low tier throttles per-minute tokens; expect `Rate limit approaching, waiting…` pauses), and their non-deterministic-input-deterministic-scoring cases can occasionally fail on model variance even when nothing regressed. A nightly/manual/label-triggered job is more appropriate than a required PR check.
- Either way, always run `pnpm check-types` (typechecks `src/**/*` and `evals/**/*` together) first — it's free and catches the most common eval-authoring mistakes before spending API budget.

# Codex Refactor Prompt — Modify Booking Flow

## Context

Refactor the existing **booking modify flow** in the Homestay Assistant project according to the agreed discussion in the referenced ChatGPT conversation:

<https://chatgpt.com/share/6a843648-52fc-83ec-ac00-db56a224116d>

The goal is to make the modify flow deterministic, maintainable, and consistent with the existing architecture:

- Next.js / React UI
- CopilotKit
- AG-UI
- Mastra Agent
- HITL confirmation
- Booking mutation tools
- Zustand/UI state where already used

**Important:** Do not rewrite AG-UI or introduce a parallel architecture. Preserve the existing boundaries and improve the modify flow within the current design.

## Primary Task

Review the current implementation of the booking modification flow and refactor it based on the agreed design from the discussion.

The expected high-level flow is:

1. Resolve the user's target booking.
2. Load/resolve the authoritative booking snapshot.
3. Extract only the modifications explicitly requested by the user.
4. Build a deterministic modify draft/change set.
5. Render the modify UI/card from that draft.
6. Wait for explicit user confirmation through HITL.
7. Execute `update_booking` only after confirmation.
8. Reconcile the mutation result back into the UI/conversation.
9. Keep the flow safe for ambiguous or multi-booking cases.

## Core Rules

### 1. Never invent modification values

Only modify fields explicitly requested by the user.

Examples:

- "Change the dates to Aug 20–22" → change dates only.
- "Change guests to 4" → change guest count only.
- "Change dates to Aug 20–22 and guests to 4" → change both.
- Do not infer a new guest count from context unless it was explicitly requested.
- Do not silently change unrelated booking fields.

Preserve all unchanged values from the authoritative booking snapshot.

### 2. Separate snapshot from requested changes

Keep these concepts distinct:

- **Booking snapshot** — authoritative current state of the booking.
- **Requested changes** — fields the user explicitly wants to change.
- **Modify draft** — the proposed final state generated from snapshot + requested changes.
- **Mutation payload** — the validated payload sent to `update_booking`.

Do not use the UI representation as the source of truth for mutation.

### 3. Resolve booking before mutation

The flow must not call `update_booking` until the target booking has been resolved unambiguously.

If multiple bookings match the user's description:

- Do not guess.
- Present the matching bookings.
- Let the user select one.
- Continue the modify flow only after selection.

If no booking matches:

- Do not construct a fake modify draft.
- Return an appropriate "booking not found" state/message.

### 4. Build changes deterministically

Refactor the change-building logic so it is easy to reason about and test.

Prefer explicit typed structures such as:

```ts
type ModifyBookingChanges = {
  checkIn?: string;
  checkOut?: string;
  guests?: number;
};
```

Use the actual project's types if equivalent types already exist.

Avoid:

- loosely typed `Record<string, unknown>` where unnecessary
- mutation of the original booking snapshot
- hidden fallback values
- deriving unrelated changes from UI state
- duplicated parsing/normalization logic

### 5. Keep draft generation pure

The core transformation should be as close as possible to:

```ts
snapshot + requestedChanges -> modifyDraft
```

It should be deterministic and side-effect free.

Move network calls, HITL handling, UI effects, and mutation execution outside this transformation.

### 6. Validate before showing confirmation

Before rendering the confirmation card, validate the proposed changes.

At minimum verify:

- booking exists
- target booking is unambiguous
- dates are valid
- checkout is after check-in
- guest count is valid
- requested changes are actually different from the current booking
- no unsupported field is silently accepted

If there are no effective changes, do not show a meaningless confirmation.

### 7. HITL is the mutation boundary

The confirmation UI represents a proposed mutation, not an already-applied mutation.

Expected lifecycle:

```text
resolve booking
    ↓
snapshot
    ↓
requested changes
    ↓
build modify draft
    ↓
validate
    ↓
render ModifyBookingCard
    ↓
WAIT FOR USER CONFIRMATION
    ↓
update_booking
    ↓
mutation result
    ↓
reconcile UI / assistant response
```

Never call `update_booking` before the confirmation decision is approved.

### 8. Preserve correlation

Make sure the modify flow can reliably associate:

- target booking
- modify draft
- HITL decision
- mutation tool call
- mutation result

Do not rely on fragile "latest tool result" behavior if the existing architecture already provides a stronger correlation identifier.

If an existing correlation key / booking ID / tool-call ID mechanism is present, reuse it consistently.

### 9. Keep UI and agent responsibilities clear

The UI should display the draft and collect confirmation.

The agent/tool layer should:

- resolve the booking
- construct/validate the change set
- execute the mutation after approval
- return authoritative mutation results

Do not duplicate business logic in React components.

The UI should not independently reconstruct the mutation payload from displayed text.

### 10. Preserve existing successful flows

The refactor must not regress:

- finding a booking
- modifying dates
- modifying guests
- modifying dates + guests
- selecting among multiple matching bookings
- HITL approval
- HITL rejection/cancellation
- mutation failure handling
- post-mutation UI refresh/reconciliation

Also preserve existing booking data and unrelated fields.

## Recommended Refactor Strategy

### Step 1 — Inspect before editing

First inspect the repository and identify:

- modify booking agent flow
- modify booking tools
- booking resolution logic
- booking snapshot types
- requested-change parsing
- `buildModifyChangeRows` and related helpers
- `ModifyBookingCard`
- HITL confirmation handling
- `update_booking`
- correlation logic
- Zustand state involved in modify flow
- tests covering modify behavior

Do not start by blindly rewriting files.

### Step 2 — Map the current flow

Document the actual current call/event flow before changing it.

For example:

```text
User
 → agent
 → resolve booking
 → snapshot
 → build changes
 → ModifyBookingCard
 → HITL
 → update_booking
 → result
 → UI reconciliation
```

Compare the implementation against the target architecture above.

### Step 3 — Refactor the smallest coherent surface

Prefer small, focused changes.

Do not perform unrelated cleanup.

Do not rename unrelated APIs.

Do not change AG-UI event semantics unless absolutely required to make the agreed modify design work.

### Step 4 — Consolidate business rules

Move duplicated rules into focused helpers where appropriate.

Examples:

- resolving effective requested changes
- validating date ranges
- determining whether a change is effective
- building the final mutation payload
- mapping mutation results to UI state

Keep helpers small and typed.

### Step 5 — Make mutation payload explicit

The final `update_booking` input should be derived from validated requested changes and the authoritative snapshot.

Conceptually:

```ts
const payload = {
  bookingId: snapshot.bookingId,
  ...(changes.checkIn !== undefined && {
    checkIn: changes.checkIn,
  }),
  ...(changes.checkOut !== undefined && {
    checkOut: changes.checkOut,
  }),
  ...(changes.guests !== undefined && {
    guests: changes.guests,
  }),
};
```

Adapt this to the actual project API/types.

Do not send unchanged fields merely because they happen to exist in the snapshot unless the API contract requires them.

## Error / Edge Cases

Explicitly handle:

### Ambiguous booking

```text
User request
    ↓
multiple matching bookings
    ↓
show selection
    ↓
user selects booking
    ↓
continue modify flow
```

### No effective changes

Example:

```text
Current guests: 4
User: "Change guests to 4"
```

Do not execute a mutation.

Return a clear no-op result.

### Invalid dates

Reject before confirmation/mutation.

### Invalid guest count

Reject before confirmation/mutation.

### Mutation failure

Keep the original booking state intact and show the authoritative failure.

Do not optimistically pretend the booking changed.

### HITL rejection

Do not call `update_booking`.

The modify draft should be discarded/closed according to the existing HITL lifecycle.

## Testing Requirements

Add or update tests for the refactored behavior.

At minimum cover:

1. Modify dates only.
2. Modify guests only.
3. Modify dates + guests.
4. Preserve unchanged fields.
5. Never invent guests.
6. Never invent dates.
7. Same-value modification becomes a no-op.
8. Invalid date range is rejected.
9. Invalid guest count is rejected.
10. Multiple matching bookings require selection.
11. No matching booking does not create a draft.
12. HITL approval executes `update_booking`.
13. HITL rejection does not execute `update_booking`.
14. Mutation failure does not produce a successful UI state.
15. Correlation between draft → HITL → mutation result remains stable.

Prefer table-driven tests for combinations of requested changes.

## Acceptance Criteria

The refactor is complete only when:

- [ ] Modify flow follows the agreed snapshot → changes → draft → validate → HITL → mutation lifecycle.
- [ ] No requested value is invented.
- [ ] Unchanged booking fields are preserved.
- [ ] Ambiguous bookings require explicit selection.
- [ ] Mutation cannot happen before HITL approval.
- [ ] Modify draft generation is deterministic and testable.
- [ ] Mutation payload is explicit and validated.
- [ ] UI does not become the business-logic source of truth.
- [ ] Existing modify scenarios continue to work.
- [ ] Relevant tests pass.
- [ ] TypeScript/type-check passes.
- [ ] Lint/format checks pass where applicable.
- [ ] No unrelated refactors are introduced.

## Codex Working Instructions

Work as a senior TypeScript engineer.

Before making changes:

1. Inspect the relevant files.
2. Trace the current modify flow end-to-end.
3. Identify where the current implementation differs from the agreed design.
4. State the concrete refactor plan briefly.

Then implement the refactor.

After implementation:

1. Run focused modify-flow tests first.
2. Run type-check.
3. Run lint/format checks relevant to changed files.
4. Fix regressions caused by the refactor.
5. Summarize:
   - files changed
   - architectural changes
   - behavior changes
   - tests run and results
   - any remaining risks

### Important constraints

- Do not rewrite the entire booking system.
- Do not rewrite AG-UI.
- Do not introduce a new state-management library.
- Do not duplicate booking business rules in the UI.
- Do not make speculative changes unrelated to modify flow.
- Follow existing project conventions when they are sound.
- Prefer the smallest refactor that fully satisfies the agreed design.

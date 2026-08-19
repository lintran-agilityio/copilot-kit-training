# Claude Code Prompt — Refactor MODIFY Flow with BookingResolution

## Objective

Refactor the existing **MODIFY booking flow** to use `BookingResolution` as the single resolution model for identifying an existing booking.

The refactor must follow this behavior:

```text
MODIFY workflow
      │
      ▼
get_bookings({
  roomName,
  purpose: "resolve"
})
      │
      ├── 0 → no active booking
      │
      ├── 1 → continue modify
      │
      └── N → show_modify_dialog_select
                         │
                         ▼
                    user selects
                         │
                         ▼
              find_booking_by_id(modify)
                         │
                         ▼
              merge stated changes
                         │
                    ┌────┴────┐
                    │         │
                  no-op    changes
                    │         │
                    ▼         ▼
                 inform    capacity check
                              │
                              ▼
                    check_room_availability
                              │
                              ▼
                    CONFIRM_MODIFY_BOOKING
                              │
                              ▼
                       update_booking
```

Do not implement a parallel/alternative resolution path.

---

## Architecture Rules

Follow this invariant:

> **LLM extracts entities → application validates/resolves entities → tool executes the resolved operation.**

The LLM should extract the requested `roomName` and stated modifications. It must not guess which booking is the target when multiple bookings match.

`get_bookings({ roomName, purpose: "resolve" })` is responsible for resolving the existing booking.

`find_booking_by_id()` is used only after a booking ID has been deterministically resolved/selected, to obtain the canonical booking detail required by MODIFY.

`find_room` must NOT be part of the existing-booking resolution path.

---

## Required MODIFY Behavior

### 1. Initial entity extraction

For a request such as:

> "I want to change the Courtyard Duplex to 4 guests"

the model should extract conceptually:

```ts
{
  intent: "modify",
  roomName: "Courtyard Duplex",
  changes: {
    guests: 4
  }
}
```

Do not make the model infer or fabricate a booking ID.

### 2. Resolve existing booking

Call:

```ts
get_bookings({
  roomName: "<extracted room name>",
  purpose: "resolve"
})
```

Interpret the result through `BookingResolution`.

#### Zero matches

Return the normal MODIFY "no active booking" behavior.

Do not call:

- `find_room`
- `find_booking_by_id`
- `check_room_availability`
- `update_booking`

#### One match

Treat the booking as deterministically resolved.

Continue with:

```text
find_booking_by_id(modify)
→ merge stated changes
→ no-op / capacity validation
→ availability validation
→ confirmation
→ update
```

#### Multiple matches

Do NOT let the LLM choose one.

Show:

```text
show_modify_dialog_select
```

The user selects the intended booking.

Only after the selection is available should the flow call:

```text
find_booking_by_id(modify)
```

using the selected booking ID.

---

## BookingResolution

Inspect the existing `BookingResolution` implementation and reuse it rather than creating a second resolution abstraction.

The semantic states should support:

```ts
type BookingResolution =
  | {
      status: "resolved";
      booking: Booking;
    }
  | {
      status: "ambiguous";
      bookings: Booking[];
    }
  | {
      status: "not_found";
      bookings: [];
    };
```

Adapt the exact type shape to the existing codebase if it already differs.

Do not introduce duplicate types/constants/helpers with the same responsibility.

---

## Existing Booking vs Target-State Availability

Keep these responsibilities separate.

`get_bookings(... purpose: "resolve")` answers:

> Which existing booking does the user want to modify?

`check_room_availability` answers:

> Is the requested modified state available?

Therefore, keep `check_room_availability` in MODIFY unless the existing implementation already performs an equivalent availability check against the **exact requested modified dates and guest count**.

Do not remove availability validation merely because `get_bookings` returns room/booking information.

---

## MODIFY State/Step Flow

Refactor the existing MODIFY step machine / workflow so that the canonical order is:

```text
MODIFY
  ↓
extract requested room + stated changes
  ↓
get_bookings(purpose="resolve")
  ↓
BookingResolution
  ├─ not_found → no active booking
  ├─ ambiguous → show_modify_dialog_select
  │                    ↓
  │              selected booking ID
  │
  └─ resolved → resolved booking ID
                       ↓
             find_booking_by_id(modify)
                       ↓
             merge stated changes
                       ↓
                  no-op check
                       ↓
              capacity validation
                       ↓
           check_room_availability
                       ↓
            CONFIRM_MODIFY_BOOKING
                       ↓
                 update_booking
```

Make the flow deterministic wherever possible. Do not rely on prompt instructions alone for state that can be derived by application code.

---

## Prompt / Intent Playbook Changes

Inspect and update the MODIFY-related `intent_playbook` / prompt instructions.

The instructions must explicitly communicate:

1. `get_bookings` is the resolver for an existing booking.
2. Use `purpose: "resolve"` when resolving a booking by room name.
3. Do not call `find_room` to identify an existing booking.
4. A single resolved booking can continue directly.
5. Multiple matches require `show_modify_dialog_select`.
6. Never let the model arbitrarily select one booking from multiple matches.
7. After resolution/selection, use `find_booking_by_id` with the resolved booking ID.
8. Preserve all explicitly stated user changes.
9. Do not ask the user again for fields already known from the request or resolved booking unless the existing flow genuinely requires clarification.
10. `check_room_availability` validates the requested target state before confirmation.
11. `update_booking` must only happen after `CONFIRM_MODIFY_BOOKING`.

Keep prompt instructions concise and consistent with actual application behavior. Do not encode application state-machine logic entirely in natural-language instructions.

---

## Tool/API Changes

Inspect the current implementations of:

- `get_bookings`
- `find_booking_by_id`
- `find_room`
- `check_room_availability`
- `update_booking`
- MODIFY-related tools/actions
- `show_modify_dialog_select`

Ensure the API/tool descriptions and schemas reflect the new behavior.

`get_bookings` must clearly document that:

```ts
purpose: "resolve"
```

is used to resolve an existing booking and can return:

- no matching booking
- exactly one resolved booking
- multiple matching bookings requiring user selection

Do not change tool schemas/results unnecessarily.

Prefer the smallest API change required to support the new behavior.

---

## Remove Obsolete MODIFY Resolution Logic

Search the entire codebase for MODIFY-specific logic that:

- calls `find_room` before resolving an existing booking
- uses `find_room` to translate room name → booking
- duplicates booking-resolution logic
- manually interprets duplicate bookings outside `BookingResolution`
- lets the model select a booking from an ambiguous result
- calls `find_booking_by_id` before a booking ID has been resolved
- asks the user for booking information that `get_bookings` already resolved

Remove or refactor obsolete paths.

Do not remove `find_room` globally if it is still required by room search/availability/create flows.

The requirement is specifically:

> `find_room` must be removed from the MODIFY existing-booking resolution flow.

---

## Preserve Existing Behavior

Do not regress unrelated flows.

Out of scope unless required by compilation/tests:

- CREATE flow behavior
- CANCEL flow behavior
- room search behavior
- unrelated UI
- unrelated API contracts
- unrelated HITL behavior
- changing tool result schemas unnecessarily
- introducing a new booking-resolution abstraction when `BookingResolution` already exists

Reuse existing patterns from the CANCEL flow where they are applicable.

---

## No-Op and Validation

After the canonical booking has been loaded:

### No-op

If the stated changes produce no effective change compared with the existing booking:

```text
do not call check_room_availability
do not show CONFIRM_MODIFY_BOOKING
do not call update_booking
```

Use the existing MODIFY no-op user-facing behavior.

### Capacity

If guest count changes, validate against the resolved room capacity before proceeding.

Use the existing capacity-validation implementation/pattern.

### Availability

If the target state requires availability validation:

```text
check_room_availability
```

must validate the **modified target state**, not merely the current booking state.

Do not use the old booking's dates/guests as a substitute for the requested modified state.

---

## Confirmation and Mutation

The final mutation sequence must remain:

```text
check_room_availability
        ↓
CONFIRM_MODIFY_BOOKING
        ↓
user confirms
        ↓
update_booking
```

Never call `update_booking` before confirmation.

Do not bypass the existing HITL confirmation mechanism.

---

## Implementation Process

Before editing:

1. Inspect the existing MODIFY flow end-to-end.
2. Locate `BookingResolution`.
3. Locate `get_bookings` and its `purpose` handling.
4. Locate `find_booking_by_id`.
5. Locate MODIFY `intent_playbook`.
6. Locate the MODIFY step machine/state transitions.
7. Locate `show_modify_dialog_select`.
8. Locate existing tests for MODIFY, booking resolution, and ambiguous bookings.
9. Identify the smallest set of files that need changes.

Then implement the refactor.

Do not blindly rewrite the flow. Preserve existing abstractions where they already match the desired architecture.

---

## Tests

Add or update tests for at least these scenarios.

### Case 1 — no booking

```text
User: "Modify Courtyard Duplex to 4 guests"

get_bookings → 0

Expected:
- no active booking response
- no find_room
- no find_booking_by_id
- no availability check
- no confirmation
- no update
```

### Case 2 — exactly one booking

```text
get_bookings → 1
```

Expected:

```text
get_bookings
→ find_booking_by_id(modify)
→ merge changes
→ validation
→ check_room_availability
→ CONFIRM_MODIFY_BOOKING
→ update_booking
```

### Case 3 — multiple bookings

```text
get_bookings → N
```

Expected:

```text
get_bookings
→ show_modify_dialog_select
→ user selects booking
→ find_booking_by_id(modify)
→ merge changes
→ validation
→ availability
→ confirmation
→ update
```

The model must not arbitrarily select a booking.

### Case 4 — no-op

Resolved booking already has the requested value.

Expected:

```text
get_bookings
→ find_booking_by_id
→ merge
→ no-op
```

No availability, confirmation, or update.

### Case 5 — capacity failure

Requested guest count exceeds room capacity.

Expected:

```text
get_bookings
→ find_booking_by_id
→ merge
→ capacity validation fails
```

Do not continue to confirmation/update.

### Case 6 — availability failure

Modified dates/guests are unavailable.

Expected:

```text
...
→ check_room_availability
→ unavailable
```

Do not show successful confirmation or call `update_booking`.

### Case 7 — room name extraction

For:

> "gonna modify my Courtyard Duplex booking"

Ensure `Courtyard Duplex` is treated as the room name/entity and is passed to `get_bookings` rather than triggering `find_room`.

---

## Verification

After implementation:

1. Run focused MODIFY tests.
2. Run booking-resolution tests.
3. Run relevant tool/API tests.
4. Run TypeScript/typecheck.
5. Run lint if available.
6. Run the relevant full test suite if practical.

If tests fail because the old tests assert the obsolete `find_room`-based MODIFY behavior, update those tests to the new canonical flow rather than preserving the obsolete behavior.

---

## Final Review Checklist

Before finishing, verify:

- [ ] MODIFY resolves existing bookings through `get_bookings(... purpose: "resolve")`.
- [ ] `BookingResolution` is the canonical resolution abstraction.
- [ ] `find_room` is removed from MODIFY booking resolution.
- [ ] 0 matches terminate with "no active booking".
- [ ] 1 match proceeds deterministically.
- [ ] N matches always require `show_modify_dialog_select`.
- [ ] User selection provides the booking ID.
- [ ] `find_booking_by_id(modify)` runs only after resolution/selection.
- [ ] Stated changes are merged with the canonical booking.
- [ ] No-op is detected before availability/confirmation/update.
- [ ] Capacity validation is preserved.
- [ ] `check_room_availability` validates the requested target state.
- [ ] `CONFIRM_MODIFY_BOOKING` precedes `update_booking`.
- [ ] Prompt/intent_playbook matches the actual deterministic flow.
- [ ] No duplicate resolution abstraction was introduced.
- [ ] Unrelated CREATE/CANCEL/room-search behavior is not regressed.
- [ ] Tests cover 0 / 1 / N resolution and validation paths.
- [ ] Typecheck/lint/tests pass.

## Deliverable

Implement the refactor directly in the codebase.

At the end, provide a concise summary containing:

1. Files changed.
2. Main MODIFY flow changes.
3. Any obsolete logic removed.
4. Tests added/updated.
5. Verification results.
6. Any remaining risks or follow-up work.

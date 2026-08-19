# Refactor Cancel Booking Flow: `find_room` / `get_bookings` / `find_booking_by_id`

We need to refactor the cancel-booking workflow based on the following architectural decision:

> **LLM extracts entities → application/API resolves entities → tool executes the resolved operation.**

The LLM should identify the user's requested `roomName` or `bookingId`, but it must NOT be responsible for resolving a room name into a specific booking ID by itself.

The main goal is to simplify the cancel workflow, remove redundant steps/API calls, make `intent_playbook` deterministic, and make `get_bookings` capable of resolving bookings by room name.

---

## 1. Current problem

The current cancel flow mixes two different concepts:

- `find_room`
  - Used for room discovery / room availability.
  - Returns room information.
  - It is not the correct source for resolving an existing booking.

- `get_bookings`
  - Used for retrieving existing bookings.
  - Should become the source of truth when the user wants to cancel a booking by room name.

- `find_booking_by_id`
  - Used to retrieve a booking when the exact `bookingId` is already known.
  - It should not be called again after `get_bookings` has already resolved the booking.

This currently creates unnecessary steps such as:

```text
user: "cancel Misty Pavilion"

→ find_room("Misty Pavilion")
→ get_bookings(...)
→ find_booking_by_id(...)
→ cancel_booking(...)
```

This is redundant and introduces unnecessary opportunities for the LLM to lose or reinterpret the resolved entity.

The desired flow is:

```text
user: "cancel Misty Pavilion"

→ extract roomName = "Misty Pavilion"
→ get_bookings(roomName="Misty Pavilion", purpose="resolve")
→ resolve booking candidate(s)
→ cancel_booking(bookingId)
```

---

# 2. Clarify responsibility of each API

## `find_room`

`find_room` is ONLY for room discovery / availability.

Use it when the user asks things such as:

```text
"find a room"
"show available rooms"
"find rooms available tomorrow"
"find Misty Pavilion"
"what rooms are available?"
```

Do NOT use `find_room` for:

```text
cancel my booking
update my booking
modify my booking
find my existing booking by room name
```

when the operation is about an existing booking.

For cancel/modify workflows, the system needs the booking aggregate, not just the room entity.

---

# 3. `get_bookings` becomes the booking-resolution API

Update `get_bookings` so it can search by `roomName`.

The API should support something conceptually equivalent to:

```ts
get_bookings({
  roomName,
  ...
})
```

The exact existing schema/types should be preserved where possible. Do not unnecessarily redesign unrelated fields.

The important behavior is:

## Case A — no matching booking

```text
get_bookings(roomName="Misty Pavilion")
→ 0 bookings
```

Return an explicit empty result.

The application should then stop the cancel workflow and tell the user that no matching booking was found.

Do NOT call:

```text
find_booking_by_id
cancel_booking
```

---

## Case B — exactly one matching booking

Example:

```text
get_bookings(roomName="Misty Pavilion")
→ [
    {
      id: "booking-123",
      room: {
        name: "Misty Pavilion",
        ...
      },
      ...
    }
  ]
```

The result must contain the full booking information and the full booked-room information.

This is already a resolved booking.

Therefore:

```text
get_bookings
→ cancel_booking
```

Do NOT call:

```text
find_booking_by_id
```

again.

The application already has the `bookingId` and the booking aggregate.

---

## Case C — multiple bookings with the same room name

Example:

```text
get_bookings(roomName="Misty Pavilion")
→ [
    booking-A + full room info,
    booking-B + full room info
  ]
```

This can happen because the same room name may appear in multiple bookings.

The API must return ALL matching booking candidates.

Each candidate should contain:

```text
booking
+
full booked room information
```

Do not return only:

```text
roomName
bookingId
```

and require the LLM/UI to join the data later.

The booking should be the aggregate root.

Conceptually:

```ts
type BookingCandidate = {
  booking: Booking
  room: Room
}
```

or the equivalent shape already used by the codebase.

Do not introduce a parallel `rooms[]` result that requires consumers to correlate rooms with bookings.

---

# 4. `find_booking_by_id` responsibility

Keep `find_booking_by_id`, but narrow its responsibility.

Use it when the application already has an exact:

```text
bookingId
```

For example:

```text
user:
"cancel booking abc123"
```

Flow:

```text
extract bookingId = "abc123"
→ find_booking_by_id("abc123")
→ cancel_booking("abc123")
```

However, if the booking has already been resolved by:

```text
get_bookings(roomName=...)
```

then DO NOT call:

```text
find_booking_by_id(resolvedBookingId)
```

again.

The resolved booking returned from `get_bookings` is sufficient.

---

# 5. New cancel workflow

Refactor the cancel workflow into the following deterministic decision tree.

## Step 1 — Extract cancellation target

The LLM should extract structured entities from the user request.

Possible entities:

```ts
{
  bookingId?: string
  roomName?: string
}
```

Examples:

```text
"cancel booking abc123"
→ bookingId = "abc123"

"cancel Misty Pavilion"
→ roomName = "Misty Pavilion"

"I want to cancel my Misty Pavilion booking"
→ roomName = "Misty Pavilion"
```

The LLM should NOT invent or infer a booking ID from a room name.

---

## Step 2 — Resolve using the strongest identifier

If `bookingId` exists:

```text
find_booking_by_id(bookingId)
```

If `bookingId` does not exist but `roomName` exists:

```text
get_bookings({
  roomName,
  purpose: "resolve"
})
```

Do NOT call `find_room`.

---

# 6. Resolution result handling

After `get_bookings(roomName)`:

### 0 matches

```text
STOP
```

Do not continue to cancellation.

Guest-facing result:

```text
I couldn't find a booking for that room.
```

Use the existing UI/result conventions of the project.

---

### 1 match

The booking is resolved.

Example:

```text
get_bookings
→ booking-123 + full room
```

Continue directly to the cancel confirmation/HITL flow.

Do NOT call:

```text
find_booking_by_id
```

again.

---

### Multiple matches

The room name is ambiguous.

Do NOT let the LLM arbitrarily choose one.

Pass all candidates to the existing HITL/UI resolution flow so the user can select the correct booking.

Example:

```text
Misty Pavilion
├── booking A
│   ├── check-in
│   ├── check-out
│   └── room info
└── booking B
    ├── check-in
    ├── check-out
    └── room info
```

After the user selects one candidate, use its existing resolved `bookingId`.

Do not perform another room search.

Do not call `find_room`.

Do not call `find_booking_by_id` unless the architecture explicitly requires it for the final selected ID and the booking object is no longer available.

Prefer carrying the resolved booking forward.

---

# 7. Refactor `intent_playbook`

Update the `intent_playbook` prompt/instructions so the cancel intent explicitly follows this decision tree.

Add a clear rule similar to:

```text
CANCEL BOOKING RESOLUTION

1. Extract the user's target entity.
   - Prefer bookingId when explicitly provided.
   - Otherwise extract roomName.
   - Do not infer bookingId from roomName.

2. If bookingId is available:
   - Resolve with find_booking_by_id.
   - Do not call find_room.

3. If only roomName is available:
   - Resolve with get_bookings(roomName, purpose="resolve").
   - Do not call find_room.
   - Do not call find_booking_by_id before get_bookings.

4. If get_bookings returns zero matches:
   - Stop the workflow.
   - Do not call cancel_booking.

5. If get_bookings returns exactly one booking:
   - Treat that booking as fully resolved.
   - Carry its bookingId and booking data forward.
   - Do not call find_booking_by_id again.

6. If get_bookings returns multiple bookings:
   - Treat the result as ambiguous.
   - Show/select from the returned booking candidates.
   - Never let the model arbitrarily choose a booking.
   - After the user selects one, continue with that resolved booking.

7. Never use find_room to resolve an existing booking for cancel/update flows.
```

The prompt should make the distinction between:

```text
ROOM DISCOVERY
→ find_room

BOOKING RESOLUTION
→ get_bookings / find_booking_by_id
```

extremely explicit.

---

# 8. Remove redundant cancel steps

Inspect the existing cancel workflow / state machine / intent playbook / tool orchestration and remove any step that exists only because the old flow used:

```text
find_room
→ get_bookings
→ find_booking_by_id
```

The new workflow should NOT contain:

```text
cancel
→ find_room
→ get_bookings
→ find_booking_by_id
```

for a room-name cancellation.

Replace it with:

```text
cancel
→ get_bookings(roomName)
→ resolve
→ HITL/confirmation if needed
→ cancel_booking
```

For an explicit booking ID:

```text
cancel
→ find_booking_by_id(bookingId)
→ HITL/confirmation if needed
→ cancel_booking
```

---

# 9. Do not duplicate resolution logic

There must be one clear source of truth for each responsibility.

Do not create multiple functions that do essentially the same thing, for example:

```text
resolveBookingByRoomName()
findBookingFromRoom()
findRoomAndBooking()
resolveRoomBooking()
```

if they are merely wrappers around the same behavior.

Prefer the existing API/tool structure.

The intended architecture is:

```text
LLM
 │
 │ extract entities
 ▼
Intent Playbook
 │
 ├── bookingId ───────────────► find_booking_by_id
 │
 └── roomName ───────────────► get_bookings(roomName)
                                  │
                                  ├── 0 → stop
                                  ├── 1 → resolved booking
                                  └── >1 → HITL selection
                                             │
                                             ▼
                                      resolved bookingId
                                             │
                                             ▼
                                      cancel_booking
```

---

# 10. Preserve the booking aggregate

When `get_bookings` resolves a room-name query, preserve the returned booking and room data throughout the workflow.

Do not reduce the result to only:

```ts
{
  bookingId: string
}
```

too early.

The workflow may need:

- booking ID
- room name
- check-in
- check-out
- guest count
- booked room information
- any existing booking metadata required by confirmation UI

The resolved booking should be the canonical object passed into the next step.

---

# 11. Update tests

Add/update tests covering at minimum:

### Test 1 — room-name cancellation, unique booking

```text
User:
"cancel Misty Pavilion"

Expected:
get_bookings(roomName="Misty Pavilion")
→ one booking

Expected calls:
get_bookings
cancel_booking

Must NOT call:
find_room
find_booking_by_id
```

---

### Test 2 — room-name cancellation, multiple bookings

```text
User:
"cancel Misty Pavilion"

Expected:
get_bookings(roomName="Misty Pavilion")
→ multiple bookings

Expected:
HITL/user selection

Must NOT:
arbitrarily select one booking
call find_room
call find_booking_by_id for every candidate
```

---

### Test 3 — room-name cancellation, no booking

```text
User:
"cancel Misty Pavilion"

Expected:
get_bookings(roomName="Misty Pavilion")
→ []

Expected:
stop

Must NOT call:
find_room
find_booking_by_id
cancel_booking
```

---

### Test 4 — explicit booking ID

```text
User:
"cancel booking abc123"

Expected:
find_booking_by_id("abc123")

Must NOT call:
find_room
get_bookings(roomName=...)
```

---

### Test 5 — room discovery remains unchanged

```text
User:
"find Misty Pavilion"

Expected:
find_room(...)
```

This verifies that the refactor does not accidentally change normal room discovery behavior.

---

# 12. Important implementation constraints

Before changing code:

1. Inspect the existing `intent_playbook`.
2. Inspect the current `get_bookings` implementation and schema.
3. Inspect `find_booking_by_id`.
4. Inspect the cancel workflow/state machine.
5. Inspect all callers of `get_bookings`.
6. Inspect all callers of `find_room`.
7. Inspect existing tests for cancel, booking lookup, and room search.
8. Identify exactly which steps/calls are now redundant.

Then implement the smallest coherent refactor.

Do not redesign unrelated booking flows.

Do not change tool schemas/results unless required for the `roomName` lookup behavior.

Do not change `find_room` semantics.

Do not introduce a second booking-resolution mechanism.

Do not make the LLM responsible for selecting a booking from ambiguous candidates.

---

# 13. Expected final architecture

The final architecture must clearly separate these two concepts:

## Room discovery

```text
User asks about rooms
        ↓
find_room
        ↓
Room results
```

## Existing booking resolution

```text
User wants to cancel/update
        ↓
Extract bookingId OR roomName
        ↓
┌───────────────────────────────┐
│ bookingId exists?             │
└──────────────┬────────────────┘
               │ yes
               ▼
       find_booking_by_id
               │
               ▼
        resolved booking

               OR

               │ no
               ▼
       get_bookings(roomName)
               │
        ┌──────┼──────┐
        ▼      ▼      ▼
       0       1      >1
        │      │       │
       stop  resolved  HITL
               │       │
               └───┬───┘
                   ▼
             resolved booking
                   │
                   ▼
             cancel_booking
```

The key invariant is:

> **`find_room` resolves rooms. `get_bookings` resolves bookings by room name. `find_booking_by_id` resolves bookings by exact booking ID. Once a booking has been resolved, never resolve it again through another API.**

---

# 14. Deliverables

After implementation, report:

1. Files changed.
2. What changed in `intent_playbook`.
3. How `get_bookings(roomName)` was implemented.
4. Which cancel steps were removed.
5. Which API calls were removed from the cancel workflow.
6. How unique vs duplicate room names are handled.
7. Tests added/updated.
8. Test/build/typecheck results.
9. Any remaining ambiguity or architectural issue.

Do not stop at changing the prompt only. Trace the actual execution flow and make sure the runtime behavior matches the new playbook.
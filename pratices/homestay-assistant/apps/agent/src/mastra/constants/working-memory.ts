/**
 * Thread-scoped workflow state is separate from retained conversation history.
 * The agent resets these fields when a workflow closes or the intent changes.
 */
export const BOOKING_WORKING_MEMORY_TEMPLATE = `# Workflow state
- Intent: none
- Status: idle
- Current step: none
- Pending confirmation: none
- Last successful tool: none

# Booking draft
- Room:
- Check-in:
- Check-out:
- Guests:
- Notes:
`;

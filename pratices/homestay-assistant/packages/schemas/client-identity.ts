import { z } from "zod";

/**
 * Browser-asserted identity/session, forwarded to the agent through CopilotKit
 * v2 `<CopilotKitProvider properties={{ identity }}>` — it rides every AG-UI run
 * (and HITL resume) as `forwardedProps.identity`.
 *
 * Trust boundary: the agent route handler reconciles `userId` against the
 * server-verified Clerk token before any field is used (see
 * apps/agent/src/mastra/middleware/client-identity.ts). Everything here is
 * advisory display data layered on top of the verified AUTH context — a greeting
 * name, an email to show back, a per-tab correlation id for logs. None of it is
 * ever an authorization or ownership signal; booking APIs enforce that in Nest
 * with the verified JWT.
 */
export const clientIdentitySchema = z.object({
  /** Clerk user id as the browser sees it. Must match the verified token. */
  userId: z.string().min(1),
  /** Clerk session id (`useAuth().sessionId`). */
  sessionId: z.string().min(1).nullish(),
  /** Primary email from the Clerk user object — for showing back to the guest. */
  email: z.string().email().nullish(),
  /** Given name, for a natural greeting. */
  firstName: z.string().min(1).nullish(),
  /** Full display name. */
  fullName: z.string().min(1).nullish(),
  /**
   * Per-browser-tab uuid minted client-side once and kept in sessionStorage.
   * Lets a whole run chain (find_room → confirm_booking → create_booking …) be
   * correlated in logs without depending on the rotating runId.
   */
  clientSessionId: z.string().min(1).nullish(),
});

export type ClientIdentity = z.infer<typeof clientIdentitySchema>;

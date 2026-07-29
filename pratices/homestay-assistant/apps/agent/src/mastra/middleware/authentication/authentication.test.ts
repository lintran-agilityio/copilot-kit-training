import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { verifyClerkAuth } from "../verify-clerk-auth.ts";

describe("authentication middleware", () => {
  it("verifyClerkAuth accepts session user id without a Clerk token", async () => {
    const auth = await verifyClerkAuth({
      sessionUserId: "user_123",
      sessionId: "sess_456",
    });

    assert.deepEqual(auth, {
      userId: "user_123",
      sessionId: "sess_456",
    });
  });

  it("verifyClerkAuth returns null when no credentials are provided", async () => {
    const auth = await verifyClerkAuth({});

    assert.equal(auth, null);
  });
});

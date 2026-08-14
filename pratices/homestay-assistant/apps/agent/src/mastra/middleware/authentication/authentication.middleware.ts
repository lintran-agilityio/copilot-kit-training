import { MASTRA_RESOURCE_ID_KEY } from "@mastra/core/request-context";
import { getAgentResourceId } from "@repo/utils";
import { AGENT_KEYS } from "@repo/constants";

import type { ContextWithMastra } from "@mastra/core/server";

import { REQUEST_CONTEXT_KEYS } from "../constants";
import { extractClerkToken, verifyClerkAuth } from "../verify-clerk-auth";
import type { MastraMiddlewareHandler } from "../middleware.types";
import type { MastraAuthContext } from "./authentication.types";

export const authenticateRequest = async (
  context: ContextWithMastra,
) => {
  return verifyClerkAuth({
    clerkToken: extractClerkToken(context.req.raw),
  });
};

export const attachAuthToRequestContext = (
  context: ContextWithMastra,
  auth: MastraAuthContext,
): void => {
  const requestContext = context.get("requestContext");

  requestContext.set(REQUEST_CONTEXT_KEYS.AUTH, auth);
  // Memory/threads persist as `${userId}:homestay-assistant`; keep that contract.
  requestContext.set(
    MASTRA_RESOURCE_ID_KEY,
    getAgentResourceId(auth.userId, AGENT_KEYS.HOMESTAY_ASSISTANT),
  );
};

export const authenticationMiddleware: MastraMiddlewareHandler = async (
  context,
  next,
) => {
  const result = await authenticateRequest(context);

  if (!result.ok) {
    return context.json({ error: result.failure.error }, result.failure.status);
  }

  attachAuthToRequestContext(context, result.auth);
  await next();
};

export const createMastraServerAuthConfig = () => ({
  authenticateToken: async (token: string) => {
    const result = await verifyClerkAuth({ clerkToken: token });
    return result.ok ? result.auth : null;
  },
  mapUserToResourceId: (auth: MastraAuthContext) =>
    getAgentResourceId(auth.userId, AGENT_KEYS.HOMESTAY_ASSISTANT),
  protected: ["/api/*"],
});

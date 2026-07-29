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
): Promise<MastraAuthContext | null> => {
  return verifyClerkAuth({
    clerkToken: extractClerkToken(context.req.raw),
  });
};

export const attachAuthToRequestContext = (
  context: ContextWithMastra,
  auth: MastraAuthContext,
): void => {
  const requestContext = context.get("requestContext");
  const agentId =
    (requestContext.get(REQUEST_CONTEXT_KEYS.AGENT_ID) as string | undefined) ??
    AGENT_KEYS.MANAGE_ASSISTANT;

  requestContext.set(REQUEST_CONTEXT_KEYS.AUTH, auth);
  requestContext.set(
    MASTRA_RESOURCE_ID_KEY,
    getAgentResourceId(auth.userId, agentId),
  );
};

export const authenticationMiddleware: MastraMiddlewareHandler = async (
  context,
  next,
) => {
  const auth = await authenticateRequest(context);

  if (!auth) {
    return context.json({ error: "Authentication required" }, 401);
  }

  attachAuthToRequestContext(context, auth);
  await next();
};

export const createMastraServerAuthConfig = () => ({
  authenticateToken: async (token: string) => {
    const auth = await verifyClerkAuth({ clerkToken: token });
    return auth;
  },
  mapUserToResourceId: (auth: MastraAuthContext) =>
    getAgentResourceId(auth.userId, AGENT_KEYS.MANAGE_ASSISTANT),
  protected: ["/api/*"],
});

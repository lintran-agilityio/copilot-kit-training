import type { ToolExecutionContext } from "@mastra/core/tools";

import { parseAgentResourceId } from "@repo/utils";

import type { MastraAuthContext } from "./authentication/authentication.types";
import { REQUEST_CONTEXT_KEYS } from "./constants";

export const getAuthFromRequestContext = (
  requestContext: ToolExecutionContext["requestContext"],
): MastraAuthContext | undefined =>
  requestContext?.get(REQUEST_CONTEXT_KEYS.AUTH) as
    | MastraAuthContext
    | undefined;

export const getAuthUserId = (
  context: Pick<ToolExecutionContext, "requestContext" | "agent">,
  errorMessage = "Authentication required",
): string => {
  const authUserId = getAuthFromRequestContext(context.requestContext)?.userId;
  if (authUserId) {
    return authUserId;
  }

  const resourceId = context.agent?.resourceId;
  if (resourceId) {
    return parseAgentResourceId(resourceId).userId;
  }

  throw new Error(errorMessage);
};

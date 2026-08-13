import type { ToolExecutionContext } from "@mastra/core/tools";

import { parseAgentResourceId } from "@repo/utils";

import type { MastraAuthContext } from "./authentication/authentication.types";
import { REQUEST_CONTEXT_KEYS } from "./constants";

const AUTH_CONTEXT_MISSING =
  "Auth context missing — request must pass authentication middleware";

export const getAuthFromRequestContext = (
  requestContext: ToolExecutionContext["requestContext"],
): MastraAuthContext | undefined =>
  requestContext?.get(REQUEST_CONTEXT_KEYS.AUTH) as
    | MastraAuthContext
    | undefined;

/**
 * Reads the signed-in userId attached by authentication middleware.
 * Does not re-validate tokens — middleware already did that.
 */
export const getAuthUserId = (
  context: Pick<ToolExecutionContext, "requestContext" | "agent">,
): string => {
  const authUserId = getAuthFromRequestContext(context.requestContext)?.userId;
  if (authUserId) {
    return authUserId;
  }

  const resourceId = context.agent?.resourceId;
  if (resourceId) {
    return parseAgentResourceId(resourceId).userId;
  }

  throw new Error(AUTH_CONTEXT_MISSING);
};

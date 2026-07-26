import type { RequestContext } from "@mastra/core/request-context";
import { parseAgentResourceId } from "@repo/utils";

import { getRequestContextUserId } from "@/mastra/utils/request-context";

type ResolveAgentUserIdOptions = {
  requestContext?: RequestContext;
  resourceId?: string;
  errorMessage?: string;
};

/**
 * Resolve the authenticated user for tools.
 * Prefer RequestContext (set by Next.js before Mastra); fall back to resourceId.
 * Never trust LLM-supplied userId as authority.
 */
export const resolveAgentUserId = (
  options: ResolveAgentUserIdOptions | string | undefined,
  errorMessage = "Authentication required",
): string => {
  // Legacy signature: resolveAgentUserId(resourceId, errorMessage?)
  if (typeof options === "string" || options === undefined) {
    if (!options) {
      throw new Error(errorMessage);
    }

    return parseAgentResourceId(options).userId;
  }

  const message = options.errorMessage ?? errorMessage;
  const fromContext = getRequestContextUserId(options.requestContext);

  if (fromContext) {
    return fromContext;
  }

  if (options.resourceId) {
    return parseAgentResourceId(options.resourceId).userId;
  }

  throw new Error(message);
};

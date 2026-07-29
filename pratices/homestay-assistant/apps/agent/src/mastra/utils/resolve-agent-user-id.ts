import type { ToolExecutionContext } from "@mastra/core/tools";

import { getAuthUserId } from "@/mastra/middleware/get-auth-user-id";

export const resolveAgentUserId = (
  context: Pick<ToolExecutionContext, "requestContext" | "agent">,
  errorMessage = "Authentication required",
): string => getAuthUserId(context, errorMessage);

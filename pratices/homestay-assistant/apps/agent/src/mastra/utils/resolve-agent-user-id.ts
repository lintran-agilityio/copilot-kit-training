import { parseThreadResourceId } from "@repo/utils";

export const resolveAgentUserId = (
  resourceId: string | undefined,
  errorMessage = "Authentication required",
): string => {
  if (!resourceId) {
    throw new Error(errorMessage);
  }

  return parseThreadResourceId(resourceId).userId;
};

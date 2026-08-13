import {
  MASTRA_RESOURCE_ID_KEY,
  RequestContext,
} from "@mastra/core/request-context";
import { AGENT_KEYS } from "@repo/constants";
import { getAgentResourceId } from "@repo/utils";

import { REQUEST_CONTEXT_KEYS } from "./constants";
import type { MastraAuthContext } from "./authentication/authentication.types";

type BuildRequestContextInput = {
  auth: MastraAuthContext;
};

export const buildAgentRequestContext = ({
  auth,
}: BuildRequestContextInput): RequestContext => {
  const requestContext = new RequestContext();

  requestContext.set(REQUEST_CONTEXT_KEYS.AUTH, auth);
  // Memory/threads persist as `${userId}:manage-assistant`; keep that contract.
  requestContext.set(
    MASTRA_RESOURCE_ID_KEY,
    getAgentResourceId(auth.userId, AGENT_KEYS.MANAGE_ASSISTANT),
  );

  return requestContext;
};

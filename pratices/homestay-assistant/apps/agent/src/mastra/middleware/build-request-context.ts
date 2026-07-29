import {
  MASTRA_RESOURCE_ID_KEY,
  RequestContext,
} from "@mastra/core/request-context";
import { getAgentResourceId } from "@repo/utils";

import { REQUEST_CONTEXT_KEYS } from "./constants";
import type { MastraAuthContext } from "./authentication/authentication.types";

type BuildRequestContextInput = {
  auth: MastraAuthContext;
  requestId: string;
  agentId: string;
};

export const buildAgentRequestContext = ({
  auth,
  requestId,
  agentId,
}: BuildRequestContextInput): RequestContext => {
  const requestContext = new RequestContext();

  requestContext.set(REQUEST_CONTEXT_KEYS.AUTH, auth);
  requestContext.set(REQUEST_CONTEXT_KEYS.REQUEST_ID, requestId);
  requestContext.set(REQUEST_CONTEXT_KEYS.AGENT_ID, agentId);
  requestContext.set(
    MASTRA_RESOURCE_ID_KEY,
    getAgentResourceId(auth.userId, agentId),
  );

  return requestContext;
};

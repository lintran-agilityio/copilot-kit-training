import type { MastraMiddlewareHandler } from "../middleware.types";
import { REQUEST_CONTEXT_KEYS } from "../constants";

const REQUEST_ID_HEADER = "x-request-id";

export const tracingMiddleware: MastraMiddlewareHandler = async (
  context,
  next,
) => {
  const requestContext = context.get("requestContext");
  const requestId = requestContext.get(REQUEST_CONTEXT_KEYS.REQUEST_ID);

  if (typeof requestId === "string" && requestId.trim()) {
    context.header(REQUEST_ID_HEADER, requestId);
  }

  await next();
};

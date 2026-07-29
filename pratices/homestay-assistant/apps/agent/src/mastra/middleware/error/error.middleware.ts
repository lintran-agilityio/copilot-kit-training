import type { MastraMiddlewareHandler } from "../middleware.types";
import { REQUEST_CONTEXT_KEYS } from "../constants";
import { getMastraLogger } from "../logging/logger";
import { mapErrorToResponse } from "./error.mapper";

export const errorMiddleware: MastraMiddlewareHandler = async (
  context,
  next,
) => {
  try {
    await next();
  } catch (error) {
    const requestContext = context.get("requestContext");
    const requestId = requestContext.get(REQUEST_CONTEXT_KEYS.REQUEST_ID);
    const mappedError = mapErrorToResponse({
      error,
      requestId: typeof requestId === "string" ? requestId : undefined,
    });

    getMastraLogger(context).error("HTTP request failed", {
      requestId: mappedError.body.requestId,
      error: error instanceof Error ? error.message : String(error),
    });

    return context.json(mappedError.body, mappedError.status);
  }
};

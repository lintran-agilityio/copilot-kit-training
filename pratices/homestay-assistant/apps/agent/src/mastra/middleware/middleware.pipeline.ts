import type { Middleware } from "@mastra/core/server";

import { authenticationMiddleware } from "./authentication/authentication.middleware";
import { errorMiddleware } from "./error/error.middleware";
import { loggingMiddleware } from "./logging/logging.middleware";
import { requestContextMiddleware } from "./request-context/request-context.middleware";
import { tracingMiddleware } from "./tracing/tracing.middleware";

export const middlewares: Middleware[] = [
  requestContextMiddleware,
  authenticationMiddleware,
  loggingMiddleware,
  tracingMiddleware,
];

export const createMastraServerMiddleware = (): Middleware[] => [
  errorMiddleware,
  ...middlewares,
];

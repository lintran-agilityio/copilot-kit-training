import type { Middleware } from "@mastra/core/server";

import { authenticationMiddleware } from "./authentication/authentication.middleware";
import { errorMiddleware } from "./error/error.middleware";
import { loggingMiddleware } from "./logging/logging.middleware";

export const middlewares: Middleware[] = [
  authenticationMiddleware,
  loggingMiddleware,
];

export const createMastraServerMiddleware = (): Middleware[] => [
  errorMiddleware,
  ...middlewares,
];

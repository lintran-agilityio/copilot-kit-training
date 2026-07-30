import { verifyToken } from "@clerk/backend";

import type { MastraAuthContext } from "./authentication/authentication.types";
import { CLERK_TOKEN_HEADER } from "./constants";

type VerifyClerkAuthInput = {
  clerkToken?: string | null;
  sessionUserId?: string | null;
  sessionId?: string | null;
};

const stripBearerPrefix = (token: string) =>
  token.startsWith("Bearer ") ? token.slice("Bearer ".length).trim() : token.trim();

export const extractClerkToken = (request: Request): string | null => {
  const headerToken = request.headers.get(CLERK_TOKEN_HEADER);
  if (headerToken?.trim()) {
    return headerToken.trim();
  }

  const authorization = request.headers.get("authorization");
  if (authorization?.trim()) {
    return stripBearerPrefix(authorization);
  }

  return null;
};

export const verifyClerkAuth = async ({
  clerkToken,
  sessionUserId,
  sessionId,
}: VerifyClerkAuthInput): Promise<MastraAuthContext | null> => {
  if (sessionUserId?.trim()) {
    return {
      userId: sessionUserId.trim(),
      sessionId: sessionId ?? undefined,
    };
  }

  if (!clerkToken?.trim()) {
    return null;
  }

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    throw new Error("CLERK_SECRET_KEY is required to verify Clerk JWT tokens");
  }

  try {
    const payload = await verifyToken(clerkToken.trim(), { secretKey });
    const userId = payload.sub;

    if (!userId) {
      return null;
    }

    return {
      userId,
      sessionId: typeof payload.sid === "string" ? payload.sid : undefined,
    };
  } catch {
    return null;
  }
};

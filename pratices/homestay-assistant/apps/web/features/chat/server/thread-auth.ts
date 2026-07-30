import { auth } from "@clerk/nextjs/server";
import { CLERK_TOKEN_HEADER } from "agent/middleware";

export type ThreadAuthContext = {
  userId: string;
  clerkToken: string;
};

export const requireThreadAuth = async (
  request?: Request,
): Promise<ThreadAuthContext | null> => {
  const { userId, getToken } = await auth();

  if (!userId) {
    return null;
  }

  const headerToken = request?.headers.get(CLERK_TOKEN_HEADER)?.trim();
  const clerkToken = headerToken || (await getToken());

  if (!clerkToken) {
    return null;
  }

  return { userId, clerkToken };
};

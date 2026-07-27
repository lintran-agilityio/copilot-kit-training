import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isCopilotKitRoute = createRouteMatcher(["/api/copilotkit(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  // Keep OPTIONS open for preflight; route handler also allows OPTIONS.
  if (req.method === "OPTIONS") {
    return;
  }

  if (isCopilotKitRoute(req)) {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpg|jpeg|gif|png|svg|ttf|woff2?|ico)).*)",
    "/(api|trpc)(.*)",
  ],
};

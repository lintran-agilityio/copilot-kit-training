import { auth } from "@clerk/nextjs/server";

import { getBaseUrl } from "@/utils";
import { PREFIX_URL } from "@/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const baseUrl = getBaseUrl(PREFIX_URL.BACKEND);

  const response = await fetch(`${baseUrl}/bookings/${encodeURIComponent(id)}`, {
    method: "DELETE",
    cache: "no-store",
  });

  if (!response.ok) {
    let message = "Failed to cancel booking";

    try {
      const body = (await response.json()) as { message?: string | string[] };
      if (typeof body.message === "string") {
        message = body.message;
      } else if (Array.isArray(body.message)) {
        message = body.message.join(", ");
      }
    } catch {
      // use default message
    }

    return Response.json({ error: message }, { status: response.status });
  }

  const booking = await response.json();

  return Response.json(booking);
}

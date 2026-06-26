"use server";

import { auth } from "@clerk/nextjs/server";

import type { CreatedBooking } from "@/features/booking/types/booking";
import { BookingStatus } from "@repo/types";

const getApiUrl = () => process.env.API_URL ?? "http://localhost:5001";

export type CreateBookingInput = {
  roomId: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
};

export const createBookingAction = async (
  input: CreateBookingInput,
): Promise<CreatedBooking> => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("You must be signed in to create a booking.");
  }

  const response = await fetch(`${getApiUrl()}/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...input,
      userId,
      status: BookingStatus.CONFIRMED,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    let message = "Failed to create booking";

    try {
      const body = (await response.json()) as { message?: string | string[] };
      if (typeof body.message === "string") {
        message = body.message;
      } else if (Array.isArray(body.message)) {
        message = body.message.join(", ");
      }
    } catch {
      // keep default message
    }

    throw new Error(message);
  }

  return (await response.json()) as CreatedBooking;
};

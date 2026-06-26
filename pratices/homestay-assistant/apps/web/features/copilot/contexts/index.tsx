"use client";

import { BookingReadable } from "@/features/copilot/readable/booking-readable";
import { UserReadable } from "@/features/copilot/readable/user-readable";

export const CopilotContexts = () => {
  return (
    <>
      <UserReadable />
      <BookingReadable />
    </>
  );
};

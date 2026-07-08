"use client";

import { UserReadable } from "../readable";
import { BookingReadable } from "../readable";

export const CopilotContexts = () => {
  return (
    <>
      <UserReadable />
      <BookingReadable />
    </>
  );
};

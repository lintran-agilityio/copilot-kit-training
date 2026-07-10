"use client";

import {
  BookingReadable,
  PageReadable,
  UserReadable,
} from "@/features/ai-elements/readable";

export const CopilotContexts = () => {
  return (
    <>
      <UserReadable />
      <BookingReadable />
      <PageReadable />
    </>
  );
};

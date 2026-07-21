"use client";

import {
  CurrentDateReadable,
  UserReadable,
} from "@/features/copilot/readable";

export const CopilotContexts = () => {
  return (
    <>
      <CurrentDateReadable />
      <UserReadable />
    </>
  );
};

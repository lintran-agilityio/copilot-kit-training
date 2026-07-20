"use client";

import {
  CurrentDateReadable,
  UserReadable,
} from "@/features/ai-elements/readable";

export const CopilotContexts = () => {
  return (
    <>
      <CurrentDateReadable />
      <UserReadable />
    </>
  );
};

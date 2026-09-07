"use client";

import { ClientIdentitySync } from "@/features/chatbot/copilot/ClientIdentitySync";
import {
  CurrentDateReadable,
  UserReadable,
} from "@/features/chatbot/copilot/readable";

export const CopilotContexts = () => {
  return (
    <>
      <ClientIdentitySync />
      <CurrentDateReadable />
      <UserReadable />
    </>
  );
};

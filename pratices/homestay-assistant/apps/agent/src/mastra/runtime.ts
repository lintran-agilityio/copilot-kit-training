import { Mastra } from "@mastra/core/mastra";
import { LibSQLStore } from "@mastra/libsql";
import { AGENT_KEYS } from "@repo/constants";

import { homestayAgent } from "./agents/homestay-agent";
import { bookingAgent } from "./agents/booking-agent";
import { runtimeDbPath } from "./db-paths";

export const runtimeMastra = new Mastra({
  agents: {
    [AGENT_KEYS.HOMESTAY_ASSISTANT]: homestayAgent,
    [AGENT_KEYS.BOOKING_ASSISTANT]: bookingAgent,
  },
  storage: new LibSQLStore({
    id: "mastra-runtime-storage",
    url: `file:${runtimeDbPath}`,
  }),
});

export { runtimeMastra as mastra };

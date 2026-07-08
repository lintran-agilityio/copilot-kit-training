import { MastraAgent } from '@ag-ui/mastra';
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { DuckDBStore } from "@mastra/duckdb";
import { MastraCompositeStore } from '@mastra/core/storage';
import { Observability, MastraStorageExporter, MastraPlatformExporter, SensitiveDataFilter } from '@mastra/observability';

import { AGENT_KEYS } from '@repo/constants';
import { weatherWorkflow } from './workflows/weather-workflow';
import { studioDbPath } from './db-paths';

// import { bookingAgent } from './agents/booking-agent';
// import { homestayAgent } from './agents/homestay-agent';
import { manageAgent } from './agents/manage-agent';

export const mastra = new Mastra({
  workflows: { weatherWorkflow },
  agents: {
    [AGENT_KEYS.MANAGE_ASSISTANT]: manageAgent,
    // [AGENT_KEYS.HOMESTAY_ASSISTANT]: homestayAgent,
    // [AGENT_KEYS.BOOKING_ASSISTANT]: bookingAgent,
  },
  storage: new MastraCompositeStore({
    id: 'composite-storage',
    default: new LibSQLStore({
      id: "mastra-storage",
      url: `file:${studioDbPath}`,
    }),
    domains: {
      observability: await new DuckDBStore().getStore('observability'),
    }
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
  observability: new Observability({
    configs: {
      default: {
        serviceName: 'mastra',
        exporters: [
          new MastraStorageExporter(), // Persists observability events to Mastra Storage
          new MastraPlatformExporter(), // Sends observability events to Mastra Platform (if MASTRA_PLATFORM_ACCESS_TOKEN is set)
        ],
        spanOutputProcessors: [
          new SensitiveDataFilter(), // Redacts sensitive data like passwords, tokens, keys
        ],
      },
    },
  }),
});

export const copilotkitAgents = MastraAgent.getLocalAgents({
  mastra,
  resourceId: 'default',
});

import { auth } from "@clerk/nextjs/server";

import {

  CopilotRuntime,

  InMemoryAgentRunner,

  createCopilotRuntimeHandler,

} from "@copilotkit/runtime/v2";

import { getCopilotkitAgents } from "agent/copilotkit";

import {

  getCurrentAgentRequest,

  runAgentRequestPipeline,

  runWithAgentRequest,

  toAgentRequestState,

} from "agent/middleware";



export const runtime = "nodejs";



const basePath = "/api/copilotkit";



const copilotRuntime = new CopilotRuntime({

  agents: async () => {

    const agentRequest = getCurrentAgentRequest();



    if (!agentRequest) {

      return {};

    }



    return getCopilotkitAgents({

      userId: agentRequest.auth.userId,

      agentId: agentRequest.agentId,

      requestContext: agentRequest.requestContext,

    });

  },

  runner: new InMemoryAgentRunner(),

});



const multiRouteHandler = createCopilotRuntimeHandler({

  runtime: copilotRuntime,

  basePath,

});



const singleRouteHandler = createCopilotRuntimeHandler({

  runtime: copilotRuntime,

  basePath,

  mode: "single-route",

});



const dispatchCopilotRequest = (req: Request) => {

  const pathname = new URL(req.url).pathname.replace(/\/$/, "") || "/";



  if (pathname === basePath && req.method === "POST") {

    return singleRouteHandler(req);

  }



  return multiRouteHandler(req);

};



const handler = async (req: Request) => {

  const { userId, sessionId } = await auth();

  const pipeline = await runAgentRequestPipeline({

    request: req,

    sessionUserId: userId,

    sessionId,

  });



  if (!pipeline.ok) {

    return Response.json({ error: pipeline.error }, { status: pipeline.status });

  }



  return runWithAgentRequest(toAgentRequestState(pipeline), () =>

    dispatchCopilotRequest(req),

  );

};



export const GET = handler;

export const POST = handler;

export const PATCH = handler;

export const DELETE = handler;

export const OPTIONS = handler;


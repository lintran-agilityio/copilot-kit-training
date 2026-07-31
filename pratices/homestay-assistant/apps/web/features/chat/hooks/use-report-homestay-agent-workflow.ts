import { useEffect } from "react";

import { useHomestayAgentUiStore } from "@/features/chat/stores/homestay-agent-ui-store";
import type {
  HomestayAgentFocusType,
  HomestayAgentTaskStatus,
  HomestayAgentTaskType,
} from "@/features/chat/types";

type WorkflowFocus = {
  type: HomestayAgentFocusType;
  id: string;
};

/** Registers an active agent workflow slice for HomestayAgentContext (stacked by key). */
export const useReportHomestayAgentWorkflow = (
  active: boolean,
  key: string,
  task: { type: HomestayAgentTaskType; status: HomestayAgentTaskStatus },
  focus?: WorkflowFocus,
) => {
  const pushWorkflow = useHomestayAgentUiStore((state) => state.pushWorkflow);
  const popWorkflow = useHomestayAgentUiStore((state) => state.popWorkflow);

  useEffect(() => {
    if (!active) {
      return;
    }

    pushWorkflow({ key, task, focus });

    return () => {
      popWorkflow(key);
    };
  }, [
    active,
    focus?.id,
    focus?.type,
    key,
    popWorkflow,
    pushWorkflow,
    task.status,
    task.type,
  ]);
};

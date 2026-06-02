import { useInterrupt } from "@copilotkit/react-core/v2";
import { TODO_AGENT_NAME } from "../agents/todo-agent";

import { DeleteConfirmation } from "../../components/TodoList/DeleteConfirmation";

export const DeleteConfirmationInterrupt = () => {
  useInterrupt({
    agentId: TODO_AGENT_NAME,
    enabled: (event) => event.value.type === "delete_confirmation",
    render: ({ event, resolve }) => {
      return (
        <DeleteConfirmation
          status={event.value.status}
          result={event.value.result}
          todoText={event.value.todoText}
          todoId={event.value.todoId}
          onConfirm={() => resolve({ approved: true, })}
          onCancel={() => resolve({ approved: false, })}
        />
      )
    }
  });

  return null;
};

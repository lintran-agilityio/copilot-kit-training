"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  randomUUID,
  useAgent,
  UseAgentUpdate,
  useCopilotKit,
  useThreads,
} from "@copilotkit/react-core/v2";

import { ChatInput } from "./chat-input";
import { MessageList } from "./message-list";
import { SuggestionList } from "./suggestion-list";
import { Role, Todo } from "@/types";
import { TODO_AGENT_NAME } from "@/ai/agents/todo-agent";
import { useTodoSuggestions } from "@/ai/suggestions/todo-suggestion";
import { TodoTools } from "@/ai/tools";
import { DeleteConfirmationInterrupt } from "@/ai/interrupts/delete-confirmation";
import { TodoList } from "../TodoList/todo-list";
import { TodoThreadSidebar } from "./todo-thread-sidebar";

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

const TodoChatContent = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [defaultThreadId] = useState(() => randomUUID());
  const { copilotkit } = useCopilotKit();

  const { threads, isLoading: isThreadsLoading, renameThread } = useThreads({
    agentId: TODO_AGENT_NAME,
  });

  const activeThreadId =
    selectedThreadId ??
    (!isThreadsLoading ? (threads[0]?.id ?? defaultThreadId) : defaultThreadId);

  const { agent } = useAgent({
    agentId: TODO_AGENT_NAME,
    updates: [UseAgentUpdate.OnMessagesChanged, UseAgentUpdate.OnStateChanged],
  });

  useEffect(() => {
    const state = agent.state as { todos?: unknown };
    if (!Array.isArray(state.todos)) {
      agent.setState({ ...state, todos: [] });
    }
  }, [agent]);

  useEffect(() => {
    let detached = false;
    const connectAbortController = new AbortController();

    // CopilotKit requires setting threadId on the agent before connectAgent.
    // eslint-disable-next-line -- official CopilotKit thread switch pattern
    agent.threadId = activeThreadId;

    const connect = async () => {
      try {
        await copilotkit.connectAgent({ agent });
      } catch (error) {
        if (!detached) {
          console.error("TodoChat: connectAgent failed", error);
        }
      }
    };

    connect();

    return () => {
      detached = true;
      connectAbortController.abort();
      agent.detachActiveRun().catch(() => {});
    };
  }, [agent, activeThreadId, copilotkit]);

  const { suggestions } = useTodoSuggestions();
console.log('threads=====>', threads);
  const handleSend = async (message: string) => {
    const currentThread = threads.find((thread) => thread.id === activeThreadId);

    if (!currentThread?.name) {
      renameThread(activeThreadId, message.slice(0, 50));
    }

    agent.addMessage({
      id: `user-${randomUUID()}`,
      role: Role.USER,
      content: message,
    });
    await copilotkit.runAgent({ agent });
  };

  const handleToggleComplete = (id: string) => {
    setTodos((currentTodos) =>
      currentTodos.map((todo) =>
        todo.id === id ? { ...todo, isCompleted: !todo.isCompleted } : todo,
      ),
    );
  };

  const handleRenameThread = (threadId: string, name: string) => {};
  const handleArchiveThread = (threadId: string) => {};

  return (
    <div className="flex gap-8 p-8 min-h-screen bg-red-50">
      <div className="flex-1 h-full">
        <TodoThreadSidebar
          threads={threads}
          isLoading={isThreadsLoading}
          activeThreadId={activeThreadId}
          onSelect={setSelectedThreadId}
          onRename={handleRenameThread}
          onArchive={handleArchiveThread}
        />
      </div>
      <div className="flex-1 h-full gap-4 flex flex-col">
        <TodoTools todos={todos} setTodos={setTodos} />
        <DeleteConfirmationInterrupt />

        <div className="space-y-4">
          <TodoList todos={todos} toggleComplete={handleToggleComplete} />
        </div>

        <div className="border rounded-xl p-4 flex flex-col gap-4">
          <h2 className="text-2xl font-bold">AI Assistant</h2>

          <SuggestionList suggestions={suggestions} onSelect={handleSend} />

          <div className="flex-1 overflow-auto max-h-[500px]">
            <MessageList messages={agent.messages} />
          </div>

          <ChatInput
            onSend={handleSend}
            isLoading={agent.isRunning}
          />
        </div>
      </div>
    </div>
  );
}

export function TodoChat() {
  const isClient = useIsClient();

  if (!isClient) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
        Loading chat…
      </div>
    );
  }

  return <TodoChatContent />;
}

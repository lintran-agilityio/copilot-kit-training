"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  randomUUID,
  useAgent,
  useAgentContext,
  UseAgentUpdate,
  useConfigureSuggestions,
  useCopilotKit,
  useSuggestions,
  useThreads,
} from "@copilotkit/react-core/v2";

import { ChatInput } from "./chat-input";
import { MessageList } from "./message-list";
import { SuggestionList } from "./suggestion-list";
import { Role, Todo } from "@/types";
import { TODO_AGENT_NAME } from "@/ai/agents/todo-agent";
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
  const [todos, setTodos] = useState<Todo[]>([
    { id: "1", text: "New todo item 1", isCompleted: false },
  ]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [pendingThreadNames, setPendingThreadNames] = useState<
    Record<string, string>
  >({});
  const [defaultThreadId] = useState(() => randomUUID());
  const { copilotkit } = useCopilotKit();

  // Suggestions
  useConfigureSuggestions({
    consumerAgentId: TODO_AGENT_NAME,
    providerAgentId: "default",
    available: "always",
    // available: todos.length ? "after-first-message" : "before-first-message",
    instructions: `
      You are generating smart todo suggestions.
      Current todos: ${todos.map((todo) => `- ${todo.text} (todo.isCompleted ? 'completed' : 'active')`).join("\n")}

      Rules:
      - Generate actionable suggestions
      - Keep suggestions short
      - Focus on todo productivity
      - Avoid generic chat prompts
      - Suggest completing, assigning, organizing, or clearing todos
      - If there are completed todos, suggest clearing them
      - If the list is empty, suggest creating starter todos
    `,
    minSuggestions: 2,
    maxSuggestions: 4,
  });

  const {
    isLoading: isSuggestionsLoading,
    suggestions,
    reloadSuggestions,
  } = useSuggestions({
    agentId: TODO_AGENT_NAME,
  });

  // Set context
  useAgentContext({
    description: "Todo context",
    value: {
      todos: todos.map((todo) => {
        const serializedTodo: Record<string, string | boolean> = {
          id: todo.id,
          text: todo.text,
          isCompleted: todo.isCompleted,
        };
    
        if (todo.assignedTo !== undefined) {
          serializedTodo.assignedTo = todo.assignedTo;
        }
    
        return serializedTodo;
      }),
      totalTasks: todos.length,
      completedTasks: todos.filter((todo) => todo.isCompleted).length,
    }
  });

  useEffect(() => {
    const timeout = setTimeout(() => {
      reloadSuggestions();
    }, 300);
    return () => clearTimeout(timeout);
  }, [todos, reloadSuggestions]);


  const {
    threads,
    isLoading: isThreadsLoading,
    hasMoreThreads,
    isFetchingMoreThreads,
    fetchMoreThreads,
    renameThread,
  } = useThreads({
    agentId: TODO_AGENT_NAME,
    limit: 20,
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

  useEffect(() => {
    const pendingName = pendingThreadNames[activeThreadId];
    const currentThread = threads.find((thread) => thread.id === activeThreadId);

    if (!pendingName || !currentThread || currentThread.name) {
      return;
    }

    let cancelled = false;

    const applyPendingThreadName = async () => {
      try {
        await renameThread(activeThreadId, pendingName);
      } catch (error) {
        if (!cancelled) {
          console.warn("TodoChat: deferred renameThread failed", error);
        }
        return;
      }

      if (!cancelled) {
        setPendingThreadNames((current) => {
          if (!(activeThreadId in current)) {
            return current;
          }
          const next = { ...current };
          delete next[activeThreadId];
          return next;
        });
      }
    };

    applyPendingThreadName();

    return () => {
      cancelled = true;
    };
  }, [activeThreadId, pendingThreadNames, renameThread, threads]);

  const handleSend = async (message: string) => {
    const isNewThread = !threads.find((thread) => thread.id === activeThreadId);
    agent.addMessage({
      id: `user-${randomUUID()}`,
      role: Role.USER,
      content: message,
    });
    await copilotkit.runAgent({ agent });

    // if (isNewThread) {
    //   await renameThread(activeThreadId, message.slice(0, 50));
    // }
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
          hasMore={hasMoreThreads}
          isFetchingMore={isFetchingMoreThreads}
          onFetchMore={fetchMoreThreads}
          onSelect={setSelectedThreadId}
          onRename={handleRenameThread}
          onArchive={handleArchiveThread}
        />
      </div>
      <div className="flex-1 h-full gap-4 flex flex-col">
        <TodoTools
          todos={todos}
          setTodos={setTodos}
          onLoadingSuggestions={reloadSuggestions}
        />
        <DeleteConfirmationInterrupt />

        <div className="space-y-4">
          <TodoList
            todos={todos}
            toggleComplete={handleToggleComplete}
            isLoading={isSuggestionsLoading}
          />
        </div>

        <div className="border rounded-xl p-4 flex flex-col gap-4">
          <h2 className="text-2xl font-bold">AI Assistant</h2>

          <SuggestionList suggestions={suggestions} onSelect={handleSend} />

          <div className="flex-1 overflow-auto max-h-[500px]">
            <MessageList messages={agent.messages} />
          </div>

          <ChatInput onSend={handleSend} isLoading={agent.isRunning} />
        </div>
      </div>
    </div>
  );
};

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

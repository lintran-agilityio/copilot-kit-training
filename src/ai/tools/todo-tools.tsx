"use client";

import { randomUUID, ToolCallStatus, useFrontendTool } from "@copilotkit/react-core/v2";
import { z } from "zod";
import type { Dispatch, SetStateAction } from "react";

import { Todo } from "@/types";

interface TodoToolsProps {
  todos: Todo[];
  onLoadingSuggestions: () => void;
  setTodos: Dispatch<SetStateAction<Todo[]>>;
}

export const TodoTools = ({
  todos,
  onLoadingSuggestions,
  setTodos,
}: TodoToolsProps) => {
  const normalize = (value: string) => value.trim().toLowerCase();
  const toSafeString = (value: unknown): string | undefined => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  };
  const optionalTodoRef = (description: string) =>
    z
      .preprocess((value) => (typeof value === "string" ? value : null), z.string().nullable())
      .optional()
      .describe(description);

  const resolveTodo = (
    currentTodos: Todo[],
    identifier?: unknown,
    text?: unknown,
  ): { todo: Todo | null; error?: string } => {
    const byId = toSafeString(identifier);
    if (byId) {
      const match = currentTodos.find((todo) => todo.id === byId);
      if (match) return { todo: match };
    }

    const byText = toSafeString(text);
    if (byText) {
      const normalizedText = normalize(byText);
      const matches = currentTodos.filter(
        (todo) => normalize(todo.text) === normalizedText,
      );

      if (matches.length === 1) return { todo: matches[0] };
      if (matches.length > 1) {
        return {
          todo: null,
          error:
            `Found multiple todos named "${byText}". Please specify the id instead.`,
        };
      }
    }

    return {
      todo: null,
      error: `Todo not found. Provide a valid id or exact task text.`,
    };
  };

  const resolveTodoWithFallback = (
    currentTodos: Todo[],
    id: unknown,
    text: unknown,
  ): { todo: Todo | null; error?: string } => {
    const resolved = resolveTodo(currentTodos, id, text);
    if (resolved.todo) return resolved;

    const pendingTodos = currentTodos.filter((todo) => !todo.isCompleted);
    if (!toSafeString(id) && !toSafeString(text) && pendingTodos.length === 1) {
      return { todo: pendingTodos[0] };
    }

    return resolved;
  };

  useFrontendTool({
    name: "createTodo",
    description: "Create a new todo item",
    parameters: z.object({
      items: z.array(z.object({
        id: z
          .string()
          .describe("The id of the todo item"),
        text: z.string().describe("The text of the todo item"),
        isCompleted: z.boolean().describe("The completion status of the todo item"),
        assignedTo: z
          .preprocess(
            (val) => (typeof val === "string" ? val : null),
            z.string().nullable(),
          )
          .describe("The assigned to of the todo item"),
      }))
    }),
    handler: async ({ items }) => {
      setTodos((currentTodos) => {
        const usedIds = new Set(currentTodos.map((todo) => todo.id));
        const newTodos = items.map((item) => {
          const candidateId = item.id?.trim() || randomUUID();
          const id = usedIds.has(candidateId) ? randomUUID() : candidateId;
          usedIds.add(id);

          return {
            id,
            text: typeof item.text === "string" ? item.text : String(item.text ?? ""),
            isCompleted: false,
            assignedTo: item.assignedTo ?? undefined,
          };
        });

        return [...currentTodos, ...newTodos];
      });
      const createdCount = items.length;
      if (createdCount === 0) {
        return "No todo was created";
      }
      onLoadingSuggestions();
      return `Created ${createdCount} todo${createdCount > 1 ? "s" : ""}`;
    },

    render: ({ status, args, result }) => {
      switch (status) {
        case ToolCallStatus.InProgress:
          return <div>Creating todo...</div>;
        case ToolCallStatus.Executing:
          return <div>Creating task {args.items[0].text}</div>;
        case ToolCallStatus.Complete:
          return <div>Todo created: {result}</div>;
        case ToolCallStatus.Errored:
          return <div>Error creating todo: {result}</div>;
        default:
          return null;
      }
    }
  });

  useFrontendTool({
    name: "completeTodo",
    description: "Mark a todo item as completed",
    parameters: z.object({
      id: optionalTodoRef("The id of the todo item if available"),
      text: optionalTodoRef('Exact todo text (e.g. "READING") when id is unknown'),
    }),
    handler: async ({ id, text }) => {
      let resultMessage = "Todo completed";
      setTodos((currentTodos) => {
        const resolved = resolveTodoWithFallback(currentTodos, id, text);
        if (!resolved.todo) {
          resultMessage = resolved.error ?? "Todo not found";
          return currentTodos;
        }

        resultMessage = `Todo completed: ${resolved.todo.text}`;
        return currentTodos.map((todo) =>
          todo.id === resolved.todo?.id ? { ...todo, isCompleted: true } : todo,
        );
      });
      return resultMessage;
    },
  });

  useFrontendTool({
    name: "assignTodo",
    description: "Assign a todo item to a user",
    parameters: z.object({
      id: optionalTodoRef("The id of the todo item if available"),
      text: optionalTodoRef("Exact todo text when id is unknown"),
      assignedTo: z.string().describe("The user to assign the todo item to"),
    }),
    handler: async ({ id, text, assignedTo }) => {
      let resultMessage = "Todo assigned";
      setTodos((currentTodos) => {
        const resolved = resolveTodo(currentTodos, id, text);
        if (!resolved.todo) {
          resultMessage = resolved.error ?? "Todo not found";
          return currentTodos;
        }

        resultMessage = `Todo assigned: ${resolved.todo.text} to ${assignedTo}`;
        return currentTodos.map((todo) =>
          todo.id === resolved.todo?.id ? { ...todo, assignedTo } : todo,
        );
      });
      return resultMessage;
    },
  });

  useFrontendTool({
    name: "deleteTodo",
    description: "Delete a todo item",
    parameters: z.object({
      id: optionalTodoRef("The id of the todo item if available"),
      text: optionalTodoRef("Exact todo text when id is unknown"),
    }),
    handler: async ({ id, text }) => {
      let resultMessage = "Todo deleted";
      setTodos((currentTodos) => {
        const resolved = resolveTodo(currentTodos, id, text);
        if (!resolved.todo) {
          resultMessage = resolved.error ?? "Todo not found";
          return currentTodos;
        }

        resultMessage = `Todo deleted: ${resolved.todo.text}`;
        return currentTodos.filter((todo) => todo.id !== resolved.todo?.id);
      });
      return resultMessage;
    },
  });

  useFrontendTool({
    name: "getTodos",
    description: "Get all todo items",
    parameters: z.object({}),
    handler: async () => {
      return todos;
    },
  });

  return null;
};

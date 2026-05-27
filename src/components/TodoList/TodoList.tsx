"use client";

import { useState } from "react";

import { Todo } from "@/types";
import TodoItem from "@/components/TodoList/TodoItem";
import { randomUUID, useAgent, useAgentContext, useConfigureSuggestions, useSuggestions } from "@copilotkit/react-core/v2";
import { Role } from "@/types/role";

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");
  const [topic, setTopic] = useState("general");

  const { agent } = useAgent();

  const {
    suggestions,
    reloadSuggestions,
    clearSuggestions,
    isLoading,
  } = useSuggestions();

  const addTodo = () => {
    if (input.trim()) {
      setTodos([
        ...todos,
        { id: Date.now().toString(), text: input, isCompleted: false },
      ]);
      setInput("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      addTodo();
    }
  };

  const toggleComplete = (id: string) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, isCompleted: !todo.isCompleted } : todo,
      ),
    );
  };

  const deleteTodo = (id: string) => {
    const todo = todos.find((todo) => todo.id === id);
    const shouldDelete = window.confirm(
      todo ? `Delete "${todo.text}"?` : "Delete this todo item?",
    );

    if (shouldDelete) {
      setTodos(todos.filter((todo) => todo.id !== id));
    }
  };

  const assignPerson = (id: string, person: string | null) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, assignedTo: person || undefined } : todo,
      ),
    );
  };

  useAgentContext({
    description: "List is todo of User",
    value: todos.map(({ id, text, isCompleted, assignedTo }) => ({
      id,
      text,
      isCompleted,
      ...(assignedTo !== undefined ? { assignedTo } : {}),
    })),
  });

  useConfigureSuggestions(
    !todos.length ? {
      available: "before-first-message",
      suggestions: [
        {
          title: "First todo",
          message: "Add a todo item 1 to the list",
        },
        {
          title: "Second todo",
          message: "Add a todo item 2 to the list",
        },
        {
          title: "Third todo",
          message: "Add a todo item 3 to the list",
        },
      ]
    } : null
  )
  
  useConfigureSuggestions(
    !todos.length
      ? {
        available: "after-first-message",
        instructions: "Currently, the todo list is empty" + "based on the chat context to help them build their list step by step.",
        minSuggestions: 2,
        maxSuggestions: 3,
      } : null
  )

  useConfigureSuggestions(
    !todos.length ? {
      instructions: `Generate suggestions related to the topic: ${topic}`,
      maxSuggestions: 3,
    } : null
  )

  const selectSuggestion = (message: string) => {
    if (!message.trim() || agent.isRunning) return;

    clearSuggestions();

    agent.addMessage({
      id: `suggestion-${randomUUID()}`,
      role: Role.USER,
      content: message
    });
    clearSuggestions();
  };
console.log("suggestions", suggestions);
  return (
    <>
      <div className="mb-3 flex items-center gap-2 text-xs text-gray-600">
        <button
          className="bg-blue-500 rounded-md p-2 text-white"
          onClick={reloadSuggestions}
          disabled={isLoading || !suggestions.length || agent.isRunning}
        >
          {isLoading ? "Loading..." : "Reload suggestions"}
        </button>
        <button
          className="bg-red-500 rounded-md p-2 text-white"
          onClick={clearSuggestions}
          disabled={isLoading || !suggestions.length || agent.isRunning}
        >Clear suggestions</button>
      </div>
      <span>{isLoading ? "Loading..." : `Suggestion${suggestions.length > 1 ? 's' : ''}: ${suggestions.length}`}</span>
      <div className="flex items-center gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            type="button"
            key={`${suggestion.title}-${index}`}
            className="rounded-full border border-gray-300 bg-gray-50 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            onClick={() => selectSuggestion(suggestion.message)}
            disabled={isLoading || !suggestions.length || agent.isRunning}
          >
            {suggestion.title}
          </button>
        ))}
      </div>
      <select value={topic} onChange={(e) => setTopic(e.target.value)} className="border rounded-md p-2">
        <option value="general">General</option>
        <option value="work">Work</option>
        <option value="personal">Personal</option>
        <option value="shopping">Shopping</option>
        <option value="other">Other</option>
      </select>
      <div className="flex m-4">
        <input
          className="border rounded-md p-2 flex-1 mr-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
        />
        <button
          className="bg-blue-500 rounded-md p-2 text-white"
          onClick={addTodo}
        >
          Add Todo
        </button>
      </div>
      {todos.length > 0 && (
        <div className="border rounded-lg">
          {todos.map((todo, index) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              toggleComplete={toggleComplete}
              deleteTodo={deleteTodo}
              assignPerson={assignPerson}
              hasBorder={index !== todos.length - 1}
            />
          ))}
        </div>
      )}
    </>
  );
}

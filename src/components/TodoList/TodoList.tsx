// "use client";

// import { useEffect, useRef, useState, useSyncExternalStore } from "react";
// import { z } from "zod";
// import {
//   randomUUID,
//   useAgent,
//   useAgentContext,
//   UseAgentUpdate,
//   useConfigureSuggestions,
//   useSuggestions,
//   useFrontendTool,
//   useHumanInTheLoop,
//   useRenderTool,
//   useThreads,
//   CopilotPopup
// } from "@copilotkit/react-core/v2";

// import { Todo, Role, Status } from "@/types";
// import TodoItem from "@/components/TodoList/TodoItem";
// import DeleteConfirmation from "./DeleteConfirmation";
// import { CopilotChatConfigurationProvider } from "@copilotkit/react-core/v2/headless";
// import ToggleButton from "./ToogleButton";
// import { TodoSidebar } from "./TodoSidebar";
// import { TodoChat } from "./TodoChat";

// const AGENT_ID = "default";

// type AgentTask = {
//   id?: string;
//   task?: string;
//   status?: string;
// };

// type AgentTasksState = {
//   tasks?: AgentTask[];
// };

// function TodoListContent() {
//   const [todos, setTodos] = useState<Todo[]>([]);
//   const [input, setInput] = useState("");
//   const [topic, setTopic] = useState("general");
//   const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
//   const [defaultThreadId] = useState(() => randomUUID());

//   const { agent } = useAgent({
//     agentId: AGENT_ID,
//     updates: [UseAgentUpdate.OnStateChanged],
//   });

//   const agentState = agent.state as AgentTasksState;
//   const syncingTodosToAgentRef = useRef(false);

//   // BuiltInAgent patches shared state (e.g. add to /tasks/-). JSON Patch requires
//   // /tasks to exist as an array before append operations.
//   useEffect(() => {
//     if (!Array.isArray(agentState.tasks)) {
//       agent.setState({ tasks: [] });
//     }
//   }, [agent, agentState.tasks]);

//   useEffect(() => {
//     const { unsubscribe } = agent.subscribe({
//       onStateChanged: ({ state }) => {
//         if (syncingTodosToAgentRef.current) {
//           syncingTodosToAgentRef.current = false;
//           return;
//         }

//         const tasks = (state as AgentTasksState).tasks;
//         if (!Array.isArray(tasks)) return;

//         setTodos(
//           tasks.map((item, index) => ({
//             id: item.id ?? `task-${index}`,
//             text: item.task ?? "",
//             isCompleted: item.status === "completed",
//           })),
//         );
//       },
//     });
//     return unsubscribe;
//   }, [agent]);

//   useEffect(() => {
//     if (!Array.isArray(agentState.tasks)) return;

//     const nextTasks = todos.map((todo) => ({
//       id: todo.id,
//       task: todo.text,
//       status: todo.isCompleted ? "completed" : "pending",
//     }));

//     if (JSON.stringify(agentState.tasks) === JSON.stringify(nextTasks)) return;

//     syncingTodosToAgentRef.current = true;
//     agent.setState({ tasks: nextTasks });
//   }, [todos, agent, agentState.tasks]);

//   const { threads, isLoading: threadsLoading } = useThreads({ agentId: AGENT_ID });

//   const sidebarThreads = threads.map((thread) => ({
//     id: thread.id,
//     title: thread.name ?? "Untitled",
//   }));

//   const activeThreadId =
//     selectedThreadId ??
//     (!threadsLoading ? (threads[0]?.id ?? defaultThreadId) : null);

//   const currentThread = activeThreadId
//     ? sidebarThreads.find((thread) => thread.id === activeThreadId) ?? {
//         id: activeThreadId,
//         title: "New workspace",
//       }
//     : undefined;

//   const createThread = () => {
//     setSelectedThreadId(randomUUID());
//   };

//   const {
//     suggestions,
//     reloadSuggestions,
//     clearSuggestions,
//     isLoading,
//   } = useSuggestions();

//   const addTodo = () => {
//     if (input.trim()) {
//       setTodos([
//         ...todos,
//         { id: Date.now().toString(), text: input, isCompleted: false },
//       ]);
//       setInput("");
//     }
//   };

//   const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
//     if (e.key === "Enter") {
//       addTodo();
//     }
//   };

//   const toggleComplete = (id: string) => {
//     setTodos(
//       todos.map((todo) =>
//         todo.id === id ? { ...todo, isCompleted: !todo.isCompleted } : todo,
//       ),
//     );
//   };

//   const deleteTodo = (id: string) => {
//     const todo = todos.find((item) => item.id === id);
//     if (!todo || agent.isRunning) return;

//     agent.addMessage({
//       id: `delete-confirmation-${randomUUID()}`,
//       role: Role.USER,
//       content: `Please call the "confirmDeleteTodo" tool for this todo item:\n- todoId: ${todo.id}\n- itemName: ${todo.text}\nOnly proceed with deletion based on user confirmation.`,
//     });
//   };

//   const assignPerson = (id: string, person: string | null) => {
//     setTodos(
//       todos.map((todo) =>
//         todo.id === id ? { ...todo, assignedTo: person || undefined } : todo,
//       ),
//     );
//   };

//   useAgentContext({
//     description: "List is todo of User",
//     value: todos.map(({ id, text, isCompleted, assignedTo }) => ({
//       id,
//       text,
//       isCompleted,
//       ...(assignedTo !== undefined ? { assignedTo } : {}),
//     })),
//   });

//   // useConfigureSuggestions(
//   //   !todos.length ? {
//   //     available: "before-first-message",
//   //     suggestions: [
//   //       {
//   //         title: "First todo",
//   //         message: "Add a todo item 1 to the list",
//   //       },
//   //       {
//   //         title: "Second todo",
//   //         message: "Add a todo item 2 to the list",
//   //       },
//   //       {
//   //         title: "Third todo",
//   //         message: "Add a todo item 3 to the list",
//   //       },
//   //     ]
//   //   } : null
//   // )
  
//   // useConfigureSuggestions(
//   //   !todos.length
//   //     ? {
//   //       available: "after-first-message",
//   //       instructions: "Currently, the todo list is empty" + "based on the chat context to help them build their list step by step.",
//   //       minSuggestions: 2,
//   //       maxSuggestions: 3,
//   //     } : null
//   // )

//   // useConfigureSuggestions(
//   //   !todos.length ? {
//   //     instructions: `Generate suggestions related to the topic: ${topic}`,
//   //     maxSuggestions: 3,
//   //   } : null
//   // )

//   useEffect(() => {
//     const timeout = setTimeout(() => {
//       reloadSuggestions();
//     }, 300);
  
//     return () => clearTimeout(timeout);
//   }, [topic, todos, reloadSuggestions]);

//   useConfigureSuggestions({
//     available: todos.length ? "after-first-message" : "before-first-message",
//     instructions: `
//       You are generating smart todo suggestions.
//       Current topic is: ${topic}
//       Current todos: ${todos.map((todo) => `- ${todo.text} (todo.isCompleted ? 'completed' : 'active')`).join("\n")}

//       Rules:
//       - Generate actionable suggestions
//       - Keep suggestions short
//       - Focus on todo productivity
//       - Avoid generic chat prompts
//       - Suggest completing, assigning, organizing, or clearing todos
//       - If there are completed todos, suggest clearing them
//       - If the list is empty, suggest creating starter todos
//     `,
//     minSuggestions: 2,
//     maxSuggestions: 4,
//   })

//   useFrontendTool({
//     name: "updateTodoList",
//     description: "Update the todo list",
//     parameters: z.object({
//       items: z.array(z.object({
//         id: z
//           .string()
//           .describe("The id of the todo item"),
//         text: z.string().describe("The text of the todo item"),
//         isCompleted: z.boolean().describe("The completion status of the todo item"),
//         assignedTo: z
//           .preprocess(
//             (val) => (typeof val === "string" ? val : null),
//             z.string().nullable(),
//           )
//           .describe("The assigned to of the todo item"),
//       }))
//     }),
//     handler: async ({ items }) => {
//       setTodos((todo) => {
//         const nextTodos = [...todo];
//         for (const item of items) {
//           const index = nextTodos.findIndex((todo) => todo.id === item.id);
//           const assignedTo =
//             typeof item.assignedTo === "string" ? item.assignedTo : undefined;
//           const todo: Todo = {
//             id: item.id,
//             text: typeof item.text === "string" ? item.text : String(item.text ?? ""),
//             isCompleted: Boolean(item.isCompleted),
//             ...(assignedTo ? { assignedTo } : {}),
//           };
//           if (index !== -1) {
//             nextTodos[index] = todo;
//           } else {
//             nextTodos.push(todo);
//           }
//         }
//         reloadSuggestions();
//         return nextTodos;
//       });

//       return "Todo list updated successfully";
//     }
//   })

//   useFrontendTool({
//     name: "clearCompletedTodos",
//     description: "Remove all completed todos from the list",
//     parameters: z.object({}),
//     handler: async () => {
//       let count = 0;
//       setTodos((todo) => {
//         count = todo.filter((todo) => todo.isCompleted).length;
//         return todo.filter((todo) => !todo.isCompleted);
//       })

//       clearSuggestions();

//       if (count > 0) {
//         return `Removed ${count} completed todos from the list`;
//       }

//       return "No completed todos found in the list";
//     }
//   });

//   useHumanInTheLoop({
//     name: "confirmDeleteTodo",
//     description: "Confirm deletion of a todo item before removing it",
//     parameters: z.object({
//       todoId: z.string().describe("The id of the todo item to delete"),
//       itemName: z.string().describe("The name of the todo item to delete"),
//     }),
//     followUp: true,
//     render: ({ args, status, respond, result }) => {
//       return (
//         <DeleteConfirmation
//           status={String(status)}
//           result={result}
//           todoId={args.todoId}
//           todoText={args.itemName}
//           onConfirm={async () => {
//             if (args.todoId) {
//               setTodos((currentTodos) =>
//                 currentTodos.filter((todo) => todo.id !== args.todoId),
//               );
//             }
//             await respond?.({ approved: true, id: args.todoId ?? null });
//           }}
//           onCancel={async () => {
//             await respond?.({ approved: false, id: args.todoId ?? null });
//           }}
//         />
//       );
//     }
//   })

//   useFrontendTool({
//     name: "searchTodos",
//     description: "Search for a todo item in the list",
//     parameters: z.object({
//       query: z.string().describe("The query to search for"),
//     }),
//     handler: async ({ query }) => {
//       const matchedTodos = todos.filter((todo) => todo.text.toLowerCase().includes(query.toLowerCase()));

//       return {
//         query,
//         todos: matchedTodos,
//         count: matchedTodos.length,
//       }
//     }
//   });

//   useRenderTool({
//     name: "searchTodos",
//     parameters: z.object({
//       query: z.string().describe("The query used to search todos"),
//     }),
//     render: ({ parameters, status, result }) => {
//       console.log('parameters====>', parameters);
//       if (status !== Status.Complete) {
//         return (
//           <div className="border rounded-lg p-4">
//             Searching todos...
//           </div>
//         )
//       }

//       const parsedResult =
//         typeof result === "string"
//           ? (() => {
//               try {
//                 return JSON.parse(result) as { todos?: Todo[] };
//               } catch {
//                 return {};
//               }
//             })()
//           : (result as { todos?: Todo[] } | undefined);
//       const todos = parsedResult?.todos ?? [];
      
//       if (!todos.length) {
//         return (
//           <div className="border rounded-lg p-4">
//             <p className="font-medium">
//               No todos found
//             </p>

//             <p className="text-sm text-gray-500">
//               Query: &quot;{parameters.query}&quot;
//             </p>
//           </div>
//         )
//       }

//       return (
//         <div className="border rounded-lg p-4 space-y-3">
//           <div>
//             <h3 className="font-bold text-lg">
//               Search Results
//             </h3>

//             <p className="text-sm text-gray-500">
//               Found {todos.length} todo
//               {todos.length > 1 ? "s" : ""}
//               for &quot;{parameters.query}&quot
//             </p>
//           </div>

//           <div className="space-y-2">
//             {todos.map((todo: Todo) => (
//               <div
//                 key={todo.id}
//                 className="border rounded-md p-3 flex items-center justify-between"
//               >
//                 <div>
//                   <p className="font-medium">
//                     {todo.text}
//                   </p>

//                   <p className="text-xs text-gray-500">
//                     Status:{" "}
//                     {todo.isCompleted
//                       ? "Completed"
//                       : "Active"}
//                   </p>
//                 </div>

//                 {todo.assignedTo && (
//                   <span className="text-xs bg-gray-100 px-2 py-1 rounded">
//                     {todo.assignedTo}
//                   </span>
//                 )}
//               </div>
//             ))}
//           </div>
//         </div>
//       )
//     }
//   });

//   const selectSuggestion = async (message: string) => {
//     if (!message.trim() || agent.isRunning) return;

//     clearSuggestions();

//     agent.addMessage({
//       id: `suggestion-${randomUUID()}`,
//       role: Role.USER,
//       content: message,
//     });
//     await agent.runAgent();
//   };

//   const handleUpdateTheme = (theme: string) => {
//     agent.setState({
//       ...agent.state,
//       user_theme: theme,
//     });
//   };

//   const hasCompletedTodos = todos.some((todo) => todo.isCompleted);
// console.log('todos====>', activeThreadId);
//   return (
//     <div className="flex h-screen w-full">
//       <TodoSidebar
//         threads={sidebarThreads}
//         currentThread={currentThread}
//         onCreate={createThread}
//         onSelect={setSelectedThreadId}
//       />
//       <div className="flex-1">
//         <button
//           onClick={() => handleUpdateTheme("dark")}
//           className="bg-black-500 rounded-md p-2 text-white border border-black-300"
//         >
//           Dark Mode
//         </button>
//         <button
//           onClick={() => handleUpdateTheme("light")}
//           className="bg-black-500 rounded-md p-2 text-black border border-black-300"
//         >
//           Light Mode
//         </button>
//         <div className="mb-3 flex items-center gap-2 text-xs text-gray-600">
//           <button
//             className="bg-blue-500 rounded-md p-2 text-white"
//             onClick={reloadSuggestions}
//             disabled={isLoading || !suggestions.length || agent.isRunning}
//           >
//             {agent.isRunning || isLoading ? <div className="spinner" /> : null}
//             {isLoading  || agent.isRunning? "Loading..." : "Reload suggestions"}
//           </button>
//           <select value={topic} onChange={(e) => setTopic(e.target.value)} className="border rounded-md p-2">
//             <option value="general">General</option>
//             <option value="work">Work</option>
//             <option value="personal">Personal</option>
//             <option value="shopping">Shopping</option>
//             <option value="other">Other</option>
//           </select>
//           {hasCompletedTodos && (
//             <button
//               className="bg-red-500 rounded-md p-2 text-white"
//               onClick={clearSuggestions}
//               disabled={isLoading || !suggestions.length || agent.isRunning}
//             >
//               Clear suggestions
//             </button>
//           )}
//         </div>
//         <span>{isLoading ? "Loading..." : `Suggestion${suggestions.length > 1 ? 's' : ''}: ${suggestions.length}`}</span>
//         <div className="flex items-center gap-2">
//           {suggestions.map((suggestion, index) => (
//             <button
//               type="button"
//               key={`${suggestion.title}-${index}`}
//               className="rounded-full border border-gray-300 bg-gray-50 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-50"
//               onClick={() => selectSuggestion(suggestion.message)}
//               disabled={isLoading || !suggestions.length || agent.isRunning}
//             >
//               {suggestion.title}
//             </button>
//           ))}
//         </div>
//         <div className="flex m-4">
//           <input
//             className="border rounded-md p-2 flex-1 mr-2"
//             value={input}
//             onChange={(e) => setInput(e.target.value)}
//             onKeyDown={handleKeyPress}
//           />
//           <button
//             className="bg-blue-500 rounded-md p-2 text-white"
//             onClick={addTodo}
//           >
//             Add Todo
//           </button>
//         </div>
//         <div className="flex-1 center p-4">
//           {todos.length > 0 && (
//             <div className="border rounded-lg">
//               {todos.map((todo, index) => (
//                 <TodoItem
//                   key={todo.id}
//                   todo={todo}
//                   toggleComplete={toggleComplete}
//                   deleteTodo={deleteTodo}
//                   assignPerson={assignPerson}
//                   hasBorder={index !== todos.length - 1}
//                 />
//               ))}
//             </div>
//           )}
//         </div>
//         <div className="flex-1">
//           {activeThreadId ? (
//             <TodoChat agent={agent} />
//           ) : (
//             <div className="flex items-center justify-center h-full">
//               Select or create a thread
//             </div>
//           )}
//         </div>
//       {/* <CopilotChatConfigurationProvider
//         isModalDefaultOpen={false}
//         agentId="support-agent"
//         threadId="ticket-thread"
//         labels={{
//           chatInputPlaceholder: "Ask me anything about your todo list",
//           modalHeaderTitle: "Support Chat",
//         }}
//       >
//         <ToggleButton />
//         <CopilotPopup instructions={
//           `
//             You are a smart todo assistant.

//             Available tools:
//             - updateTodoList
//             - clearCompletedTodos
//             - confirmDeleteTodo
//             - searchTodos

//             Rules:
//             - Use searchTodos when users search tasks
//             - Always use confirmDeleteTodo before deleting
//             - Help users organize todos
//             - Suggest productivity improvements
//           `}
//         />
//       </CopilotChatConfigurationProvider> */}
//       </div>
//     </div>
      
//   );
// }

// function TodoListSkeleton() {
//   return (
//     <div className="flex h-screen flex-col items-center justify-center text-sm text-gray-500">
//       Loading workspaces…
//     </div>
//   );
// }

// function useIsClient() {
//   return useSyncExternalStore(
//     () => () => {},
//     () => true,
//     () => false,
//   );
// }

// export default function TodoList() {
//   const isClient = useIsClient();

//   if (!isClient) {
//     return <TodoListSkeleton />;
//   }

//   return <TodoListContent />;
// }

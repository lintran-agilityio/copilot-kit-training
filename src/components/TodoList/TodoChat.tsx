// "use client";

// import {
//   randomUUID,
//   useAgentContext,
//   type AbstractAgent,
//   useCopilotKit,
// } from "@copilotkit/react-core/v2";
// import { useState, useCallback } from "react";

// type Props = {
//   agent: AbstractAgent;
// };

// const TODO_AI_INSTRUCTIONS = `
//   You are a Todo AI assistant.

//   Shared application state uses a "tasks" array. Each task has:
//   - task (string): the todo text
//   - status ("pending" | "completed")
//   - id (optional string)

//   To add or update todos, use AGUISendStateDelta (JSON Patch) on /tasks, or call
//   the updateTodoList frontend tool. The tasks array is always initialized.

//   Help users:
//   - create tasks
//   - organize tasks
//   - prioritize todos
//   - summarize work
// `;

// export const TodoChat = ({ agent }: Props) => {
//   const { copilotkit } = useCopilotKit();
//   const [input, setInput] = useState("");

//   useAgentContext({
//     description: "Todo AI assistant behavior",
//     value: TODO_AI_INSTRUCTIONS,
//   });

//   const { messages, isRunning } = agent;

//   const handleSend = async () => {
//     const text = input.trim();
//     if (!text) return;

//     setInput("");

//     agent.addMessage({
//       id: randomUUID(),
//       role: "user",
//       content: text,
//     });

//     await agent.runAgent();
//   };

//   const handleSendMessage = useCallback(async () => {
//     if (!input.trim()) return;

//     agent.addMessage({
//       id: randomUUID(),
//       role: "user",
//       content: input,
//     });

//     setInput("");

//     await copilotkit.runAgent({ agent });
//   }, [agent, input, copilotkit])

//   const handleStopAgent = useCallback(() => {
//     copilotkit.stopAgent({ agent });
//   }, [agent, copilotkit]);

//   return (
//     // <CopilotChat
//     //   threadId={threadId}
//     //   input={{ showDisclaimer: false }}
//     //   labels={{
//     //     modalHeaderTitle: "Todo AI",
//     //     welcomeMessageText: "Ask me to manage your tasks.",
//     //     chatDisclaimerText: "Todos are suggestions — double-check before acting.",
//     //   }}
//     // />
//     <div className="flex flex-col h-full">
//       <div className="flex-1 overflow-y-auto p-4 space-y-4">
//         {messages && messages.map((message) => (
//           <div
//             key={message.id}
//             className={
//               message.role === "user"
//                 ? "ml-auto bg-blue-100 rounded-lg p-3 max-w-md"
//                 : "bg-gray-100 rounded-lg p-3 max-w-md"
//             }
//           >
//             <p className="text-sm text-gray-700">
//               {typeof message.content === "string"
//                 ? message.content
//                 : Array.isArray(message.content)
//                   ? message.content.map((c) => (c.type === "text" ? c.text : "")).join("")
//                   : String(message.content ?? "")
//               }
//             </p>
//           </div>
//         ))}

//         {isRunning && (
//           <div>AI is thinking...</div>
//         )}
//       </div>

//       <div className="border-t p-4 flex gap-2">
//         <input
//           value={input}
//           onChange={(e) =>
//             setInput(e.target.value)
//           }
//           className="flex-1 border rounded p-2"
//           placeholder="Ask Todo AI..."
//         />

//         <button
//           onClick={handleSendMessage}
//           className="border rounded px-4"
//           disabled={isRunning}
//         >
//           Send
//         </button>
//         {agent.isRunning && (
//           <button onClick={handleStopAgent} className="text-red-500">Stop</button>
//         )}
//       </div>
//     </div>
//   )
// };

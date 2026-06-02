// import { useThreads } from "@copilotkit/react-core/v2";

// type Props = {
//   threadId: string;
// };

// export const TodoThread = ({ threadId }: Props) => {
//   const {
//     threads,
//     currentThread,
//     createThread,
//     setCurrentThreadId
//   } = useThreads(threadId);

//   return (
//     <div className="flex">
//       <aside className="w-64 border-r">
//         <button
//           onClick={() => createThread({
//             title: "New to do Thread",
//           })}
//         >
//           New Thread
//         </button>
//         {threads.map((thread) => (
//           <div
//             key={thread.id}
//             onClick={() => switchThread(thread.id)}
//           ></div>
//         ))}
//       </aside>
//     </div>
//   )
// };

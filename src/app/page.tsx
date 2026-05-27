import TodoList from "@/components/TodoList/TodoList";
import { CopilotSidebar } from "@copilotkit/react-core/v2";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <h1 className="text-2xl font-bold ">Hello CopilotKit 🪁</h1>
      <h2 className="text-base font-base mb-4">Todo List Example</h2>
      <CopilotSidebar />

      <div className="w-full max-w-md px-4">
        <TodoList />
      </div>
    </div>
  );
}

import { Todo } from "@/types";
import TodoItem from "./TodoItem";

type TodoListProps = {
  todos: Todo[];
  toggleComplete: (id: string) => void;
};

export const TodoList = ({ todos, toggleComplete }: TodoListProps) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Todo List</h1>
        <p className="text-sm text-gray-500">
          A list of your todos
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {todos.length > 0 && todos.map((todo) => (
          <TodoItem key={`${todo.id}-${todo.text}`} todo={todo} toggleComplete={toggleComplete} />
        ))}
      </div>
    </div>
  )
};

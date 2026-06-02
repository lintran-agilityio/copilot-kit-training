"use client";
import { useState } from "react";

type ChatInputProps = {
  onSend: (input: string) => void;
  isLoading: boolean;
};

export const ChatInput = ({
  onSend,
  isLoading,
}: ChatInputProps) => {
  const [input, setInput] = useState("");

  const handleSend = async () => {
    if (!input.trim()) {
      return;
    }

    await onSend(input);

    setInput("");
  };

  return (
    <div className="flex gap-2">
      {/* <select value={threadId} onChange={(e) => setThreadId(e.target.value)}>

      </select> */}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="border rounded p-2 flex-1"
        placeholder="Ask AI to manage todos..."
      />

      <button
        onClick={handleSend}
        disabled={isLoading}
        className="border rounded px-4"
      >
        Send
      </button>
    </div>
  );
};

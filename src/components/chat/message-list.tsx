import { Message } from "@copilotkit/react-core/v2";

type MessageListProps = {
  messages: Message[];
};

export const MessageList = ({ messages }: MessageListProps) => {
  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={
            message.role === "user"
              ? "text-right"
              : "text-left"
          }
        >
          <div className="text-sm opacity-60 mb-1">
            {message.role}
          </div>

          <div className="border rounded p-3 inline-block max-w-[80%]">
            {typeof message.content === "string"
              ? message.content
              : JSON.stringify(message.content)}
          </div>
        </div>
      ))}
    </div>
  );
};

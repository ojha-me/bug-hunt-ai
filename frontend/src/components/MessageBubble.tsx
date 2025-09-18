import React from "react";
import CodeSnippet from "./CodeSnippet";

export type MessageType = "conversation" | "hint" | "challenge" | "feedback";

interface MessageBubbleProps {
  sender: "user" | "ai";
  content: string;
  codeSnippet?: string;
  messageType?: MessageType;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  sender,
  content,
  codeSnippet,
  messageType = "conversation",
}) => {
  const isUser = sender === "user";

  return (
    <div
      className={`flex w-full my-2 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`
          max-w-[80%] 
          p-4 
          rounded-2xl 
          shadow-lg 
          ${isUser ? "bg-blue-100 text-gray-900 rounded-br-none" : "bg-white text-gray-900 rounded-bl-none"}
          ${messageType === "hint" ? "border-l-4 border-yellow-400" : ""}
          ${messageType === "challenge" ? "border-l-4 border-red-400" : ""}
          ${messageType === "feedback" ? "border-l-4 border-green-400" : ""}
        `}
      >
        <p className="whitespace-pre-wrap">{content}</p>

        {codeSnippet && (
          <div className="mt-2">
            <CodeSnippet code={codeSnippet} readOnly={true} />
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;

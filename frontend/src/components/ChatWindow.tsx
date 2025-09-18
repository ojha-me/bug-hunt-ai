import React, { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import type  { MessageType } from "./MessageBubble";

export interface Message {
  id: string;
  sender: "user" | "ai";
  content: string;
  codeSnippet?: string;
  messageType?: MessageType;
}

interface ChatWindowProps {
  messages: Message[];
  isTyping?: boolean; // shows AI typing indicator
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isTyping = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 bg-gray-50 rounded-b-2xl flex flex-col"
    >
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          sender={msg.sender}
          content={msg.content}
          codeSnippet={msg.codeSnippet}
          messageType={msg.messageType}
        />
      ))}

      {isTyping && (
        <div className="flex justify-start my-2">
          <div className="bg-white text-gray-500 px-4 py-2 rounded-2xl shadow-lg italic">
            AI is typing...
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;

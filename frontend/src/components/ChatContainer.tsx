import React, { useState } from "react";
import ChatWindow from "./ChatWindow";
import ChatInput from "./ChatInput";
import { v4 as uuidv4 } from "uuid";
import type { Message } from "./ChatWindow";

const ChatContainer: React.FC<{ selectedConversationId: string }> = ({
  selectedConversationId,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: uuidv4(),
      sender: "ai",
      content: "Hello! I'm BugHunt AI 🐞. Ready to hunt some bugs?",
    },
    {
      id: uuidv4(),
      sender: "user",
      content: "Yes! Show me my first challenge.",
    },
    {
      id: uuidv4(),
      sender: "ai",
      content: "Here’s a buggy JavaScript snippet. Can you spot the issue?",
      codeSnippet: `function add(a, b) {
  return a - b; // Oops, subtraction instead of addition
}`,
      messageType: "challenge",
    },
  ]);

  const [isTyping, setIsTyping] = useState(false);

  const handleSend = (messageContent: string) => {
    const newMessage: Message = {
      id: uuidv4(),
      sender: "user",
      content: messageContent,
    };

    setMessages((prev) => [...prev, newMessage]);

    setIsTyping(true);

    setTimeout(() => {
      const aiResponse: Message = {
        id: uuidv4(),
        sender: "ai",
        content: "Nice! Let me review your fix...",
        messageType: "feedback",
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto bg-gray-50 rounded-2xl shadow-lg">
      <ChatWindow messages={messages} isTyping={isTyping} />
      <ChatInput onSend={handleSend} isSending={isTyping} />
    </div>
  );
};

export default ChatContainer;

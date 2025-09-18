import React, { useState } from "react";
import type { KeyboardEvent, FormEvent } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  isSending?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, isSending = false }) => {
  const [inputValue, setInputValue] = useState("");

  const handleSend = (e?: FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;
    onSend(inputValue.trim());
    setInputValue("");
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      handleSend();
    }
  };

  return (
    <form
      onSubmit={handleSend}
      className="w-full flex items-center gap-3 p-4 bg-white shadow-md rounded-t-2xl"
    >
      <input
        type="text"
        placeholder="Type your message..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyPress}
        disabled={isSending}
        className="flex-1 px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 text-gray-900"
      />
      <button
        type="submit"
        disabled={isSending}
        className="bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 disabled:bg-gray-300"
      >
        Send
      </button>
    </form>
  );
};

export default ChatInput;

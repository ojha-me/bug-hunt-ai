import { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";

interface ChatMessage {
  sender: "user" | "ai" | "system";
  text: string;
}

function App() {
  const [userInput, setUserInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws/code/");
    socketRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connection established.");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const message: ChatMessage = {
          sender: data.type === 'ai_chat' ? 'ai' : 'system',
          text: data.payload.message,
        };
        setChatMessages((prev) => [...prev, message]);
      } catch (error) {
        console.error("Failed to parse incoming message:", error);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed.");
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []); 

  const handleSendMessage = () => {
    if (userInput.trim() && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const message = {
        type: "user_chat",
        payload: { message: userInput },
      };
      socketRef.current.send(JSON.stringify(message));

      // Add user's message to the chat display
      setChatMessages((prev) => [...prev, { sender: "user", text: userInput }]);
      setUserInput(""); // Clear the input field
    }
  };

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  return (
    <div className="bg-gray-900 text-white h-screen flex flex-col p-4 gap-4">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-cyan-400">BugHunt AI</h1>
        <p className="text-gray-400">Your AI-powered pair programmer</p>
      </header>

      <main className="flex-grow flex gap-4 overflow-hidden">
        <div className="w-1/2 bg-gray-800 rounded-lg overflow-hidden">
          <Editor
            height="100%"
            theme="vs-dark"
            defaultLanguage="python"
            defaultValue="# Let's find some bugs!"
          />
        </div>

        <div className="w-1/2 flex flex-col bg-gray-800 rounded-lg p-4">
          {/* Message Display Area */}
          <div ref={chatContainerRef} className="flex-grow mb-4 overflow-y-auto">
            {chatMessages.map((msg, index) => (
              <div
                key={index}
                className={`mb-3 p-3 rounded-lg text-sm ${
                  msg.sender === "user"
                    ? "bg-blue-600 ml-auto"
                    : msg.sender === "ai"
                    ? "bg-gray-700"
                    : "bg-gray-600 text-center text-xs"
                }`}
                style={{ maxWidth: "90%" }}
              >
                {msg.text}
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="flex">
            <input
              type="text"
              className="flex-grow bg-gray-700 rounded-l-md p-2 focus:outline-none"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Ask the AI for a hint or to fix your code..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSendMessage();
                }
              }}
            />
            <button
              className="bg-cyan-500 text-white p-2 rounded-r-md hover:bg-cyan-600 disabled:bg-gray-500"
              onClick={handleSendMessage}
              disabled={!userInput.trim()}
            >
              Send
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;

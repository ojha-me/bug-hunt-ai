import { useCallback, useEffect, useRef, useState } from "react";
import { getAccessToken } from "../api/apiClient";

interface Message {
  id: string;
  sender: "user" | "ai";
  content: string;
  code_snippet?: string | null;
  language?: string;
  timestamp: string;
}

interface OutgoingMessage {
  message: string;
  code_snippet?: string;
  language?: string;
}

interface Event {
  type: 'typing_start' | 'done' | 'message_chunk'; // Keep other events if needed
  content: string;
}

// Type guard to check if the received data is a message
function isMessage(data: any): data is Message {
  return data && typeof data.id !== 'undefined' && typeof data.sender !== 'undefined';
}

// Type guard to check if the received data is an event
function isEvent(data: any): data is Event {
    return data && typeof data.type !== 'undefined';
}


export const useWebSocket = (conversationId: string) => {
  const socketRef = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false); // <-- New state for typing indicator
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const token = getAccessToken();

  useEffect(() => {
    if (!token) {
      console.error("No access token found");
      return;
    }

    const apiBase = import.meta.env.VITE_WS_BASE;
    const wsPath = "/ws";
    const wsProtocol = apiBase.startsWith("https") ? "wss://" : "ws://";
    const urlWithoutProtocol = apiBase.replace(/^https?:\/\//, "").replace(/\/$/, "");
    const wsUrl = `${wsProtocol}${urlWithoutProtocol}${wsPath}/chat/${conversationId}/?token=${token}`;
    
    
    const connect = () => {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Check if it's a message event
          if (isMessage(data)) {
            setMessages((prev) =>
              prev.some((m) => m.id === data.id) ? prev : [...prev, data]
            );
          // Check if it's an event for typing status
          } else if (isEvent(data)) {
              if (data.type === 'typing_start') {
                  setIsTyping(true);
              } else if (data.type === 'done') {
                  setIsTyping(false);
              }
          } else {
            console.warn("Invalid data format received:", data);
          }
        } catch (err) {
          console.error("Failed to parse message:", err);
        }
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        setIsTyping(false); // Reset typing status on disconnect
        socketRef.current = null;

        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const attempt = reconnectAttemptsRef.current + 1;
          reconnectAttemptsRef.current = attempt;
          const timeout = 2 ** attempt * 1000;
          console.log(`WebSocket closed unexpectedly, reconnecting in ${timeout}ms`);
          setTimeout(connect, timeout);
        }
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        setIsTyping(false); // Also reset on error
      };
    };

    connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.close(1000, "Component unmounted");
        socketRef.current = null;
      }
    };
  }, [conversationId, token]);

  const sendMessage = useCallback((payload: OutgoingMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(payload));
    } else {
      console.warn("WebSocket not connected");
    }
  }, []);

  // Expose the new isTyping state
  return { messages, sendMessage, isConnected, isTyping };
};
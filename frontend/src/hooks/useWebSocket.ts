import { useCallback, useEffect, useRef, useState } from "react";
import { getAccessToken } from "../api/apiClient";

interface Message {
  id: string;
  sender: "user" | "ai";
  content: string;
  timestamp: string;
}

export const useWebSocket = (conversationId: string) => {
  const socketRef = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const token = getAccessToken();

  useEffect(() => {
    if (!token) {
      console.error("No access token found");
      return;
    }

    const wsPath = "/ws";
    const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
    const host = window.location.host; 

    const wsUrl = `${protocol}${host}${wsPath}/chat/${conversationId}/?token=${token}`;
    
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
          const data: Message = JSON.parse(event.data);
          setMessages((prev) =>
            prev.some((m) => m.id === data.id) ? prev : [...prev, data]
          );
        } catch (err) {
          console.error("Failed to parse message:", err);
        }
      };

      ws.onclose = (event) => {
        setIsConnected(false);
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

  const sendMessage = useCallback((message: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ message }));
    } else {
      console.warn("WebSocket not connected");
    }
  }, []);

  return { messages, sendMessage, isConnected };
};

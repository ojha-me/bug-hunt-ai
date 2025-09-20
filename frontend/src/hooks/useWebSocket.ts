import { useCallback, useEffect, useState } from "react";
import { getAccessToken } from "../api/apiClient";

interface Message {
  id: string;
  sender: "user" | "ai";
  content: string;
  timestamp: string;
}

export const useWebSocket = (conversationId: string) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;

  const token = getAccessToken();

  useEffect(() => {
    if (!token) {
      console.error("No access token found");
      return;
    }

    const API_URL = import.meta.env.VITE_API_URL;
    if (!API_URL) {
      console.error("VITE_API_URL is not set in .env");
      return;
    }

    const protocol = API_URL.startsWith("https://") ? "wss" : "ws";
    const apiUrl = new URL(API_URL);
    const wsHost = apiUrl.port ? `${apiUrl.hostname}:${apiUrl.port}` : apiUrl.hostname;

    const wsUrl = `${protocol}://${wsHost}/ws/chat/${conversationId}/?token=${token}`;
    console.log("Connecting to:", wsUrl);

    const newSocket = new WebSocket(wsUrl);

    newSocket.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
      setReconnectAttempts(0);
    };

    newSocket.onmessage = (event) => {
      const data: Message = JSON.parse(event.data);

      setMessages((prev) =>
        prev.some((m) => m.id === data.id) ? prev : [...prev, data]
      );
    };

    newSocket.onclose = (event) => {
      setIsConnected(false);
      console.log("WebSocket closed:", event.code, event.reason);

      if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
        const attempt = reconnectAttempts + 1;
        setReconnectAttempts(attempt);
        setTimeout(() => {
          console.log(`Reconnecting... Attempt ${attempt}`);
          setSocket(null); 
        }, 2 ** attempt * 1000); // Exponential backoff
      }
    };

    newSocket.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    setSocket(newSocket);

    return () => {
      newSocket.close(1000);
    };
  }, [conversationId, token, reconnectAttempts]);

  const sendMessage = useCallback(
    (message: string) => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ message }));
      } else {
        console.warn("WebSocket not connected");
      }
    },
    [socket]
  );

  return {
    messages,
    sendMessage,
    isConnected,
  };
};

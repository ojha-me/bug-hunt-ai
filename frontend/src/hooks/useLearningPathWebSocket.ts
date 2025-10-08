import { useEffect, useRef, useState } from "react";
import { getAccessToken } from "../api/apiClient";

const MAX_RECONNECT_ATTEMPTS = 5;

interface LearningPathMessage {
  id: string;
  sender: "user" | "ai";
  content: string;
  code_snippet?: string | null;
  language?: string | null;
  timestamp: string;
  type?: "explanation" | "question" | "challenge" | "feedback" | "encouragement" | "assessment";
  next_action?: string;
}

export const useLearningPathWebSocket = (
  learningTopicId: string,
  onMessageReceived?: (message: LearningPathMessage) => void
) => {
  const socketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const reconnectAttemptsRef = useRef(0);


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
    const wsUrl = `${wsProtocol}${urlWithoutProtocol}${wsPath}/learning-path/${learningTopicId}/?token=${token}`;
    
    const connect = () => {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log("Learning Path WebSocket connected");
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("WebSocket message received:", data);
          
          // Handle different message types
          if (data.type === "conversation" && data.payload) {
            // This is a regular message
            if (onMessageReceived) {
              onMessageReceived(data.payload);
            }
          } else if (data.type === "typing") {
            // Handle typing indicator
            setIsTyping(data.payload?.isTyping || false);
          }
        } catch (err) {
          console.error("Failed to parse message:", err);
        }
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        setIsTyping(false);
        socketRef.current = null;

        if (event.code !== 1000 && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          const attempt = reconnectAttemptsRef.current + 1;
          reconnectAttemptsRef.current = attempt;
          const timeout = 2 ** attempt * 1000;
          console.log(`Learning Path WebSocket closed unexpectedly, reconnecting in ${timeout}ms`);
          setTimeout(connect, timeout);
        }
      };

      ws.onerror = (err) => {
        console.error("Learning Path WebSocket error:", err);
        console.log("Socket readyState:", ws.readyState);
        console.log("Socket URL:", ws.url);
        setIsTyping(false);
      };
    };

    connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.close(1000, "Component unmounted");
        socketRef.current = null;
      }
    };
  }, [learningTopicId, token, onMessageReceived]);


  return {
    isConnected,
    isTyping,
  };
};

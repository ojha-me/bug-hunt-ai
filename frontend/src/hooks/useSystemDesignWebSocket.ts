import { useCallback, useEffect, useRef, useState } from "react";
import { getAccessToken } from "../api/apiClient";
import type { ReactFlowDiagram } from "../types/ai_core/api_types";

export interface SDMessage {
  id: string;
  sender: "user" | "ai";
  content: string;
  timestamp: string;
  diagram?: ReactFlowDiagram | null;
}

const isMessage = (data: any): data is SDMessage =>
  data && typeof data.id !== "undefined" && typeof data.sender !== "undefined";

const isEvent = (data: any): data is { type: string; content?: string } =>
  data && typeof data.type !== "undefined";

export const useSystemDesignWebSocket = (conversationId: string) => {
  const socketRef = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<SDMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const token = getAccessToken();

  useEffect(() => {
    if (!token) {
      console.error("No access token found");
      return;
    }
    const apiBase = import.meta.env.VITE_WS_BASE || window.location.origin;
    const wsProtocol = apiBase.startsWith("https") ? "wss://" : "ws://";
    const urlWithoutProtocol = apiBase.replace(/^https?:\/\//, "").replace(/\/$/, "");
    const wsUrl = `${wsProtocol}${urlWithoutProtocol}/ws/system-design/${conversationId}/?token=${token}`;

    const connect = () => {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;
      ws.onopen = () => {
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
      };
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (isMessage(data)) {
            setMessages((prev) =>
              prev.some((m) => m.id === data.id) ? prev : [...prev, data]
            );
          } else if (isEvent(data)) {
            if (data.type === "typing_start") setIsTyping(true);
            else if (data.type === "done") setIsTyping(false);
          }
        } catch (err) {
          console.error("Failed to parse system design message:", err);
        }
      };
      ws.onclose = (event) => {
        setIsConnected(false);
        setIsTyping(false);
        socketRef.current = null;
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const attempt = reconnectAttemptsRef.current + 1;
          reconnectAttemptsRef.current = attempt;
          setTimeout(connect, 2 ** attempt * 1000);
        }
      };
      ws.onerror = () => setIsTyping(false);
    };

    connect();
    return () => {
      if (socketRef.current) {
        socketRef.current.close(1000, "Component unmounted");
        socketRef.current = null;
      }
    };
  }, [conversationId, token]);

  const sendMessage = useCallback((payload: { message: string }) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(payload));
    } else {
      console.warn("WebSocket not connected");
    }
  }, []);

  const submitDiagram = useCallback((diagram: ReactFlowDiagram) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ action: "submit_diagram", diagram }));
    } else {
      console.warn("WebSocket not connected");
    }
  }, []);

  const regenerate = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ action: "regenerate" }));
    } else {
      console.warn("WebSocket not connected");
    }
  }, []);

  return { messages, sendMessage, submitDiagram, regenerate, isConnected, isTyping };
};
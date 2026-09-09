import { useCallback, useEffect, useRef, useState } from "react";
import { getAccessToken } from "../api/apiClient";
import type { InterviewEvaluation } from "../api/mockInterview";

export interface InterviewMessage {
  id: string;
  sender: "user" | "ai";
  content: string;
  timestamp: string;
}

const isMessage = (data: any): data is InterviewMessage =>
  data && typeof data.id !== "undefined" && typeof data.sender !== "undefined";

/**
 * WebSocket hook for the live mock interview. Talks to ws/mock-interview/, streams
 * the interviewer <-> candidate turns, and surfaces the final scored evaluation.
 */
export const useMockInterviewWebSocket = (conversationId: string) => {
  const socketRef = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [evaluation, setEvaluation] = useState<InterviewEvaluation | null>(null);
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
    const wsUrl = `${wsProtocol}${urlWithoutProtocol}/ws/mock-interview/${conversationId}/?token=${token}`;

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
          if (data && data.type === "interview_result" && data.evaluation) {
            setIsGrading(false);
            setIsTyping(false);
            setEvaluation(data.evaluation as InterviewEvaluation);
          } else if (isMessage(data)) {
            setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data]));
          } else if (data && typeof data.type !== "undefined") {
            if (data.type === "typing_start") setIsTyping(true);
            else if (data.type === "grading_start") { setIsGrading(true); setIsTyping(false); }
            else if (data.type === "done") { setIsTyping(false); setIsGrading(false); }
          }
        } catch (err) {
          console.error("Failed to parse interview message:", err);
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

  const sendMessage = useCallback((message: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ message }));
    } else {
      console.warn("WebSocket not connected");
    }
  }, []);

  const endInterview = useCallback((code: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      setIsGrading(true);
      socketRef.current.send(JSON.stringify({ action: "end_interview", code }));
    } else {
      console.warn("WebSocket not connected");
    }
  }, []);

  return { messages, isConnected, isTyping, isGrading, evaluation, sendMessage, endInterview };
};

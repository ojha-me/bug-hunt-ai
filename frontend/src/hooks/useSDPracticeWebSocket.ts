import { useCallback, useEffect, useRef, useState } from "react";
import { getAccessToken } from "../api/apiClient";
import type { ReactFlowDiagram } from "../types/ai_core/api_types";

export interface PracticeMessage {
  id: string;
  sender: "user" | "ai";
  content: string;
  timestamp: string;
  message_type?: string | null;
  diagram?: ReactFlowDiagram | null;
  phaseComplete?: boolean;
  phaseSummary?: string;
}

export interface PracticePhaseState {
  current_phase: number;
  phase_states: Record<string, unknown>;
  status: string;
}

const isMessage = (data: unknown): data is PracticeMessage => {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return typeof d.id === "string" && typeof d.sender === "string";
};

const isEvent = (data: unknown): data is { type: string; content?: string } => {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return typeof d.type === "string";
};

const unwrapAIContent = (data: PracticeMessage): PracticeMessage => {
  if (data.sender !== "ai") return data;
  try {
    const parsed = JSON.parse(data.content);
    if (parsed && typeof parsed === "object" && typeof parsed.content === "string") {
      return {
        ...data,
        content: parsed.content,
        phaseComplete: Boolean(parsed.phase_complete),
        phaseSummary: typeof parsed.phase_summary === "string" ? parsed.phase_summary : "",
      };
    }
  } catch {
    /* plain text greeting */
  }
  return data;
};

export const useSDPracticeWebSocket = (conversationId: string) => {
  const socketRef = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<PracticeMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [phaseState, setPhaseState] = useState<PracticePhaseState | null>(null);
  const [sessionCompleted, setSessionCompleted] = useState(false);
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
    const wsUrl = `${wsProtocol}${urlWithoutProtocol}/ws/system-design/practice/${conversationId}/?token=${token}`;

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
            const unwrapped = unwrapAIContent(data);
            setMessages((prev) =>
              prev.some((m) => m.id === unwrapped.id) ? prev : [...prev, unwrapped]
            );
          } else if (isEvent(data)) {
            if (data.type === "typing_start") setIsTyping(true);
            else if (data.type === "done") setIsTyping(false);
            else if (data.type === "phase_state") {
              try {
                setPhaseState(JSON.parse(data.content || "{}"));
              } catch {
                /* ignore malformed phase state */
              }
            } else if (data.type === "session_completed") {
              setSessionCompleted(true);
            }
          }
        } catch (err) {
          console.error("Failed to parse practice message:", err);
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
      socketRef.current.send(JSON.stringify({ action: "message", message }));
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

  return {
    messages,
    sendMessage,
    submitDiagram,
    isConnected,
    isTyping,
    phaseState,
    sessionCompleted,
  };
};
import { useCallback, useEffect, useRef, useState } from "react";
import { getAccessToken } from "../api/apiClient";
import { getSDLessonMessages } from "../api/systemDesign";
import type { ReactFlowDiagram } from "../types/ai_core/api_types";
import type { SDLearningMessage } from "../types/system_design/api_types";

export interface SDLearningProgress {
  ai_confidence: number;
  covered_points: string[];
  remaining_points: string[];
  progress_percentage: number;
  is_ready_to_move_on: boolean;
}

export interface SDLearningWSHandlers {
  onLessonChange?: (lessonId: string, referenceDiagram: ReactFlowDiagram | null) => void;
  onCourseCompleted?: () => void;
}

interface SDOutgoingMessage {
  id?: string;
  sender?: string;
  content?: string;
  timestamp?: string;
  message_type?: string;
  type?: string;
  code_snippet?: string | null;
  language?: string | null;
  diagram?: ReactFlowDiagram | null;
  next_action?: string | null;
}

const isMessage = (data: SDOutgoingMessage): boolean =>
  data && typeof data.id !== "undefined" && typeof data.sender !== "undefined";

const isEvent = (data: Record<string, unknown>): boolean =>
  data && typeof data.type === "string" && typeof data.id === "undefined";

export const useSDLearningWebSocket = (
  courseId: string | null | undefined,
  lessonId: string | null | undefined,
  handlers?: SDLearningWSHandlers
) => {
  const socketRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const [messages, setMessages] = useState<SDLearningMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [progress, setProgress] = useState<SDLearningProgress | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token || !courseId || !lessonId) return;

    let disposed = false;
    setIsConnected(false);
    setIsTyping(false);
    setIsReady(false);
    setProgress(null);
    setMessages([]);

    const apiBase = import.meta.env.VITE_WS_BASE || window.location.origin;
    const wsProtocol = apiBase.startsWith("https") ? "wss://" : "ws://";
    const base = apiBase.replace(/^https?:\/\//, "").replace(/\/$/, "");
    const wsUrl = `${wsProtocol}${base}/ws/system-design/learn/${courseId}/lesson/${lessonId}/?token=${token}`;

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = async () => {
      if (disposed) return;
      setIsConnected(true);
      try {
        const history = await getSDLessonMessages(courseId, lessonId);
        if (!disposed) setMessages(history);
      } catch (err) {
        console.error("Failed to load lesson history:", err);
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (isMessage(data)) {
          const msg: SDLearningMessage = {
            id: data.id!,
            sender: data.sender === "user" ? "user" : "ai",
            content: data.content ?? "",
            timestamp: data.timestamp ?? new Date().toISOString(),
            code_snippet: data.code_snippet ?? null,
            language: data.language ?? null,
            type: data.message_type ?? data.type ?? null,
            next_action: data.next_action ?? null,
            diagram: data.diagram ?? null,
          };
          setMessages((prev) =>
            prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
          );
        } else if (isEvent(data)) {
          switch (data.type) {
            case "typing_start":
              setIsTyping(true);
              break;
            case "done":
              setIsTyping(false);
              break;
            case "ready_for_next_lesson":
              setIsReady(true);
              break;
            case "progress_update":
              try {
                setProgress(JSON.parse(data.content || "null"));
              } catch (err) {
                console.error("Bad progress_update payload:", err);
              }
              break;
            case "lesson_changed":
              try {
                const change = JSON.parse(data.content || "{}");
                setIsReady(false);
                setProgress(null);
                handlersRef.current?.onLessonChange?.(
                  change.new_lesson_id,
                  change.reference_diagram ?? null
                );
              } catch (err) {
                console.error("Bad lesson_changed payload:", err);
              }
              break;
            case "course_completed":
              handlersRef.current?.onCourseCompleted?.();
              break;
          }
        }
      } catch (err) {
        console.error("Failed to parse SD learning message:", err);
      }
    };

    ws.onclose = () => {
      if (disposed) return;
      setIsConnected(false);
      setIsTyping(false);
      socketRef.current = null;
    };

    return () => {
      disposed = true;
      if (socketRef.current) {
        socketRef.current.close(1000, "Lesson changed / unmount");
        socketRef.current = null;
      }
    };
  }, [courseId, lessonId]);

  const sendMessage = useCallback((payload: { message: string }) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(payload));
    } else {
      console.warn("SD learning WebSocket not connected");
    }
  }, []);

  const submitDiagram = useCallback((diagram: ReactFlowDiagram) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ action: "submit_diagram", diagram }));
    } else {
      console.warn("SD learning WebSocket not connected");
    }
  }, []);

  const nextLesson = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ action: "next_lesson" }));
    } else {
      console.warn("SD learning WebSocket not connected");
    }
  }, []);

  return { messages, sendMessage, submitDiagram, nextLesson, isConnected, isTyping, isReady, progress };
};
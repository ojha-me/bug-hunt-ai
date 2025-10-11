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

export interface SubtopicProgress {
  covered_points: string[];
  remaining_points: string[];
  ai_confidence: number;
  progress_percentage: number;
  challenges_completed: number;
  challenges_attempted: number;
  is_ready_to_move_on: boolean;
}

export const useLearningPathWebSocket = (
  learningTopicId: string,
  handleNewMessage?: (message: LearningPathMessage) => void,
  handleSubtopicComplete?: () => void,
  handleProgressUpdate?: (progress: SubtopicProgress) => void,
  handleReadyForNext?: () => void,
  handleSubtopicChanged?: (data: { new_subtopic: string; completed_subtopic: string }) => void
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
          
          // Handle different event types
          if (data.type === "typing_start") {
            // Handle typing indicator
            setIsTyping(true);
          } else if (data.type === "done") {
            // AI finished typing
            setIsTyping(false);
          } else if (data.type === "subtopic_complete") {
            // AI detected subtopic completion
            if (handleSubtopicComplete) {
              handleSubtopicComplete();
            }
          } else if (data.type === "progress_update") {
            // Progress update from backend
            if (handleProgressUpdate && data.content) {
              try {
                const progressData = JSON.parse(data.content);
                handleProgressUpdate(progressData);
              } catch (err) {
                console.error("Failed to parse progress data:", err);
              }
            }
          } else if (data.type === "ready_for_next_subtopic") {
            // User is ready to move to next subtopic
            if (handleReadyForNext) {
              handleReadyForNext();
            }
          } else if (data.type === "subtopic_changed") {
            // Subtopic has changed
            if (handleSubtopicChanged && data.content) {
              try {
                const changeData = JSON.parse(data.content);
                handleSubtopicChanged(changeData);
              } catch (err) {
                console.error("Failed to parse subtopic change data:", err);
              }
            }
          } else if (data.payload) {
            // This is a message (user or AI) - has payload with message data
            if (handleNewMessage) {
              handleNewMessage(data.payload);
            }
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
  }, [learningTopicId, token, handleNewMessage, handleSubtopicComplete, handleProgressUpdate, handleReadyForNext, handleSubtopicChanged]);


  const sendMessage = (message: string, codeSnippet?: string, language?: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          action: "message",
          message,
          code_snippet: codeSnippet,
          language: language || "python",
        })
      );
    } else {
      console.error("WebSocket is not connected");
    }
  };

  const moveToNextSubtopic = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          action: "next_subtopic",
        })
      );
    } else {
      console.error("WebSocket is not connected");
    }
  };

  return {
    isConnected,
    isTyping,
    sendMessage,
    moveToNextSubtopic,
  };
};

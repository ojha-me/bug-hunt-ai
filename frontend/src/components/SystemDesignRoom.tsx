import { useParams, useLocation } from "react-router-dom";
import {
  Box,
  Text,
  Button,
  Stack,
  Group,
  Alert,
  Loader,
  Textarea,
  Divider,
  Badge,
} from "@mantine/core";
import { useState, useMemo, useEffect, useRef } from "react";
import { FaExclamationCircle } from "react-icons/fa";
import { RiFocus3Line } from "react-icons/ri";
import { useSystemDesignWebSocket } from "../hooks/useSystemDesignWebSocket";
import { getConversation } from "../api/conversation";
import type { ConversationResponse, ReactFlowDiagram } from "../types/ai_core/api_types";
import { useQuery } from "@tanstack/react-query";
import { SystemDesignWhiteboard } from "./SystemDesignWhiteboard";
import { SystemDesignDiagram } from "./SystemDesignDiagram";

export const SystemDesignRoom = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const location = useLocation();
  const navState = location.state as { diagram?: ReactFlowDiagram; prompt?: string } | null;
  const initialDiagram = navState?.diagram;
  const [message, setMessage] = useState(navState?.prompt ?? "");
  const [loadedDiagram, setLoadedDiagram] = useState<ReactFlowDiagram | null>(initialDiagram ?? null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages: liveMessages,
    sendMessage,
    submitDiagram,
    isConnected,
    isTyping,
  } = useSystemDesignWebSocket(conversationId!);

  const { data: conversation } = useQuery<ConversationResponse>({
    queryKey: ["conversation", conversationId, "system-design"],
    queryFn: () => getConversation(conversationId!),
    enabled: !!conversationId,
  });

  const allMessages = useMemo(() => {
    if (!conversation?.messages) return [];
    const messageIds = new Set(conversation.messages.map((m) => m.id));
    const uniqueLiveMessages = liveMessages.filter((m) => !messageIds.has(m.id));
    const history = conversation.messages ?? [];
    return [...history, ...uniqueLiveMessages].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [conversation, liveMessages]);

  const handleSendMessage = () => {
    if (message.trim() && isConnected) {
      sendMessage({ message });
      setMessage("");
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages, isTyping]);

  return (
    <Box
      p="md"
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--app-bg)",
      }}
    >
      {!isConnected && (
        <Alert icon={<FaExclamationCircle size={16} />} title="Connection Lost" color="red" mb="md">
          Trying to reconnect to the server...
        </Alert>
      )}

      <Group mb="md">
        <Badge size="lg" variant="light" color="violet">
          System Design
        </Badge>
        <Text size="sm" c="dimmed">
          Chat with the interviewer on the left, sketch boxes &amp; arrows on the right.
        </Text>
      </Group>

      <Box style={{ flex: 1, minHeight: 0, display: "flex", gap: "1rem", flexDirection: "row" }}>
        {/* Chat panel */}
        <Box
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            border: "1px solid var(--app-line)",
            borderRadius: "var(--mantine-radius-lg)",
            background: "var(--app-surface)",
            overflow: "hidden",
            boxShadow: "var(--mantine-shadow-sm)",
          }}
        >
          <Box style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "1rem" }}>
            {allMessages.length === 0 && !isTyping ? (
              <Text c="dimmed" ta="center" pt="xl">
                Describe a system (e.g. "Design Twitter") and I'll interview you. When ready, draw architecture and click "Ask AI to review".
              </Text>
            ) : (
              <Stack gap="sm">
                {allMessages.map((msg) => (
                  <Box
                    key={msg.id}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: msg.sender === "user" ? "flex-end" : "flex-start",
                    }}
                  >
                    <Box
                      p="sm"
                      style={{
                        backgroundColor: msg.sender === "user" ? "var(--mantine-primary-color-light)" : "var(--app-sunken)",
                        border: "1px solid var(--app-line)",
                        borderRadius: "12px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                        maxWidth: "70%",
                      }}
                    >
                      {msg.content && (
                        <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                          {msg.content}
                        </Text>
                      )}
                      {msg.diagram && (
                        <>
                          <SystemDesignDiagram diagram={msg.diagram} />
                          <Button
                            variant="subtle"
                            size="compact-xs"
                            color="violet"
                            mt={4}
                            leftSection={<RiFocus3Line size={14} />}
                            onClick={() => setLoadedDiagram(msg.diagram!)}
                          >
                            Load to whiteboard
                          </Button>
                        </>
                      )}
                    </Box>
                    <Text size="xs" c="dimmed" ta={msg.sender === "user" ? "right" : "left"} style={{ marginTop: "2px" }}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </Text>
                  </Box>
                ))}

                {isTyping && (
                  <Group gap="xs" style={{ alignSelf: "flex-start" }}>
                    <Box p="sm" style={{ backgroundColor: "var(--app-surface-hover)", borderRadius: "12px" }}>
                      <Loader size="sm" type="dots" />
                    </Box>
                  </Group>
                )}
                <div ref={messagesEndRef} />
              </Stack>
            )}
          </Box>

          <Divider />
          <Box style={{ padding: "0.75rem", flexShrink: 0, background: "var(--app-surface)", borderTop: "1px solid var(--app-line)" }}>
            <Group gap="sm" align="flex-end">
              <Textarea
                placeholder="Ask about requirements, capacity, trade-offs..."
                value={message}
                onChange={(e) => setMessage(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                style={{ flex: 1 }}
                disabled={!isConnected || isTyping}
                autosize
                minRows={2}
                maxRows={8}
              />
              <Button onClick={handleSendMessage} disabled={!isConnected || !message.trim() || isTyping}>
                Send
              </Button>
            </Group>
          </Box>
        </Box>

        {/* Whiteboard panel */}
        <Box
          style={{
            flex: 1,
            minWidth: 0,
            border: "1px solid var(--app-line)",
            borderRadius: "var(--mantine-radius-lg)",
            background: "var(--app-surface)",
            overflow: "hidden",
            boxShadow: "var(--mantine-shadow-sm)",
          }}
        >
          <SystemDesignWhiteboard
            loadedDiagram={loadedDiagram}
            onSubmit={(diagram) => {
              if (isConnected && !isTyping) {
                submitDiagram(diagram);
              }
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};
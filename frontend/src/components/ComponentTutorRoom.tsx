import { useParams, useNavigate } from "react-router-dom";
import { Box, Text, Button, Stack, Group, Alert, Loader, Textarea, Badge, Anchor } from "@mantine/core";
import { useState, useMemo, useEffect, useRef } from "react";
import { FaExclamationCircle, FaArrowLeft, FaComments } from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import { useQuery } from "@tanstack/react-query";
import { useComponentTutorWebSocket } from "../hooks/useComponentTutorWebSocket";
import { getConversation } from "../api/conversation";
import type { ConversationResponse } from "../types/ai_core/api_types";

export const ComponentTutorRoom = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages: liveMessages, sendMessage, isConnected, isTyping } = useComponentTutorWebSocket(conversationId!);

  const { data: conversation } = useQuery<ConversationResponse>({
    queryKey: ["conversation", conversationId, "component-tutor"],
    queryFn: () => getConversation(conversationId!),
    enabled: !!conversationId,
  });

  const allMessages = useMemo(() => {
    const history = conversation?.messages ?? [];
    const ids = new Set(history.map((m) => m.id));
    const merged = [...history, ...liveMessages.filter((m) => !ids.has(m.id))];
    return merged.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [conversation, liveMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages, isTyping]);

  const handleSend = () => {
    if (message.trim() && isConnected) {
      sendMessage({ message });
      setMessage("");
    }
  };

  return (
    <Box p="md" style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--app-bg)" }}>
      {!isConnected && (
        <Alert icon={<FaExclamationCircle size={16} />} title="Connection Lost" color="red" mb="md">
          Trying to reconnect to the tutor...
        </Alert>
      )}

      <Group justify="space-between" mb="md" wrap="nowrap">
        <Group gap="sm" wrap="nowrap">
          <Badge size="lg" variant="light" color="violet" leftSection={<FaComments size={12} />}>
            Tutor
          </Badge>
          <Text fw={600} truncate>
            {conversation?.title ?? "Component tutor"}
          </Text>
        </Group>
        <Anchor
          component="button"
          onClick={() => navigate("/system-design/components")}
          c="dimmed"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}
        >
          <FaArrowLeft size={11} /> Components
        </Anchor>
      </Group>

      <Box
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          border: "1px solid var(--app-line)",
          borderRadius: "var(--mantine-radius-lg)",
          background: "var(--app-surface)",
          overflow: "hidden",
          boxShadow: "var(--mantine-shadow-sm)",
          maxWidth: 900,
          width: "100%",
          margin: "0 auto",
        }}
      >
        <Box style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "1rem" }}>
          {allMessages.length === 0 && !isTyping ? (
            <Text c="dimmed" ta="center" pt="xl">
              Your tutor is warming up...
            </Text>
          ) : (
            <Stack gap="sm">
              {allMessages.map((msg) => (
                <Box
                  key={msg.id}
                  style={{ display: "flex", flexDirection: "column", alignItems: msg.sender === "user" ? "flex-end" : "flex-start" }}
                >
                  <Box
                    p="sm"
                    style={{
                      backgroundColor: msg.sender === "user" ? "var(--mantine-primary-color-light)" : "var(--app-sunken)",
                      border: "1px solid var(--app-line)",
                      borderRadius: "12px",
                      maxWidth: "80%",
                    }}
                  >
                    {msg.sender === "ai" ? (
                      <Box className="md-content">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </Box>
                    ) : (
                      <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                        {msg.content}
                      </Text>
                    )}
                  </Box>
                  <Text size="xs" c="dimmed" mt={2}>
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

        <Box style={{ padding: "0.75rem", flexShrink: 0, borderTop: "1px solid var(--app-line)" }}>
          <Group gap="sm" align="flex-end">
            <Textarea
              placeholder="Answer the tutor, or ask a question..."
              value={message}
              onChange={(e) => setMessage(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              style={{ flex: 1 }}
              disabled={!isConnected || isTyping}
              autosize
              minRows={1}
              maxRows={6}
            />
            <Button onClick={handleSend} disabled={!isConnected || !message.trim() || isTyping}>
              Send
            </Button>
          </Group>
        </Box>
      </Box>
    </Box>
  );
};

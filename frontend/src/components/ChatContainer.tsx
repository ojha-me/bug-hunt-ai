import { useParams } from "react-router-dom";
import {
  Box,
  Text,
  TextInput,
  Button,
  Stack,
  Group,
  Alert,
  ActionIcon,
} from "@mantine/core";
import { useState, useMemo, useEffect, useRef } from "react";
import { FaExclamationCircle } from "react-icons/fa";
import { FiMaximize, FiMinimize } from "react-icons/fi";
import { useWebSocket } from "../hooks/useWebSocket";
import { getConversation } from "../api/conversation";
import type { ConversationResponse } from "../types/ai_core/api_types";
import Editor from "@monaco-editor/react";
import { useQuery } from "@tanstack/react-query";

export const ChatContainer = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const [message, setMessage] = useState("");
  const [expandedEditors, setExpandedEditors] = useState<{
    [key: string]: boolean;
  }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages: liveMessages, sendMessage, isConnected } =
    useWebSocket(conversationId!);

  const { data: conversation } = useQuery<ConversationResponse>({
    queryKey: ["conversation", conversationId],
    queryFn: () => getConversation(conversationId!),
    enabled: !!conversationId,
  });

  const allMessages = useMemo(() => {
    const history = conversation?.messages ?? [];
    return [...history, ...liveMessages].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [conversation, liveMessages]);

  const handleSendMessage = () => {
    if (message.trim() && isConnected) {
      sendMessage(message);
      setMessage("");
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedEditors((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages]);

  return (
    <Box
      p="md"
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#f9f9f9",
      }}
    >
      {!isConnected && (
        <Alert
          icon={<FaExclamationCircle size={16} />}
          title="Connection Lost"
          color="red"
          mb="md"
        >
          Trying to reconnect to the server...
        </Alert>
      )}

      {/* Messages Area */}
      <Box
        style={{
          flex: 1,
          overflowY: "auto",
          paddingBottom: "1rem",
        }}
      >
        {allMessages.length === 0 ? (
          <Text c="dimmed" ta="center" pt="xl">
            Start a new conversation
          </Text>
        ) : (
          <Stack gap="sm">
            {allMessages.map((msg) => (
              <Box
                key={msg.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems:
                    msg.sender === "user" ? "flex-end" : "flex-start",
                  marginBottom: "0.5rem",
                }}
              >
                {/* Message Bubble */}
                <Box
                  p="sm"
                  style={{
                    backgroundColor:
                      msg.sender === "user" ? "#e3f2fd" : "#f5f5f5",
                    borderRadius: "12px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    maxWidth: "70%",
                    position: "relative",
                  }}
                >
                  {msg.code_snippet && msg.language ? (
                    <Stack gap="xs" style={{ position: "relative" }}>
                      {msg.content && (
                        <Text size="sm">{msg.content}</Text>
                      )}

                      {/* Expand/Contract Icon */}
                      <Group position="right">
                        <ActionIcon
                          size="sm"
                          variant="light"
                          onClick={() => toggleExpand(msg.id)}
                        >
                          {expandedEditors[msg.id] ? (
                            <FiMinimize />
                          ) : (
                            <FiMaximize />
                          )}
                        </ActionIcon>
                      </Group>

                      <Editor
                        className={`editor-${msg.id}`}
                        defaultLanguage={msg.language}
                        value={msg.code_snippet}
                        onChange={(newValue) => {
                          msg.code_snippet = newValue ?? "";
                        }}
                        language={msg.language}
                        options={{
                          minimap: { enabled: false },
                          fontSize: 14,
                          wordWrap: "on",
                        }}
                        height={expandedEditors[msg.id] ? "80vh" : "400px"}
                      />

                      <Button
                        size="xs"
                        variant="light"
                        onClick={() => {
                          if (isConnected) {
                            sendMessage(
                              JSON.stringify({
                                type: "code_update",
                                id: msg.id,
                                code_snippet: msg.code_snippet,
                              })
                            );
                          }
                        }}
                      >
                        Save & Send
                      </Button>
                    </Stack>
                  ) : (
                    <Text size="sm">{msg.content}</Text>
                  )}
                </Box>

                {/* Timestamp */}
                <Text
                  size="xs"
                  c="dimmed"
                  ta={msg.sender === "user" ? "right" : "left"}
                  style={{ marginTop: "2px" }}
                >
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </Text>
              </Box>
            ))}
            <div ref={messagesEndRef} />
          </Stack>
        )}
      </Box>

      {/* Input Area */}
      <Box
        style={{
          borderTop: "1px solid #ddd",
          paddingTop: "0.5rem",
          background: "#fff",
        }}
      >
        <Group gap="sm" style={{ width: "100%" }}>
          <TextInput
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && handleSendMessage()
            }
            style={{ flex: 1 }}
            disabled={!isConnected}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!isConnected || !message.trim()}
          >
            Send
          </Button>
        </Group>
      </Box>
    </Box>
  );
};

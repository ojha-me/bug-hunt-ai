import { useParams } from "react-router-dom";
import { Box, Text, TextInput, Button, Stack, Group, Alert } from "@mantine/core";
import { useState, useMemo } from "react";
import { FaExclamationCircle } from "react-icons/fa";
import { useWebSocket } from "../hooks/useWebSocket";
import { getConversation } from "../api/conversation";
import type { ConversationResponse } from "../types/ai_core/api_types";
import { useQuery } from "@tanstack/react-query";

export const ChatContainer = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const [message, setMessage] = useState("");
  const { messages: liveMessages, sendMessage, isConnected } = useWebSocket(conversationId!);

  const { data: conversation } = useQuery<ConversationResponse>({
    queryKey: ['conversation', conversationId],
    queryFn: () => getConversation(conversationId!),
    enabled: !!conversationId,
  });

  // Merge API conversation history + live WebSocket messages
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

  return (
    <Box p="md" style={{ height: "calc(100vh - 2rem)" }}>
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

      <Stack style={{ height: "100%" }}>
        <Box style={{ flex: 1, overflowY: "auto" }} p="xs">
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
                    alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                    maxWidth: "70%",
                  }}
                >
                  <Box
                    p="sm"
                    style={{
                      backgroundColor:
                        msg.sender === "user" ? "#e3f2fd" : "#f5f5f5",
                      borderRadius: "8px",
                    }}
                  >
                    <Text size="sm">{msg.content}</Text>
                  </Box>
                  <Text
                    size="xs"
                    c="dimmed"
                    ta={msg.sender === "user" ? "right" : "left"}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </Text>
                </Box>
              ))}
            </Stack>
          )}
        </Box>

        <Group gap="sm">
          <TextInput
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
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
      </Stack>
    </Box>
  );
};

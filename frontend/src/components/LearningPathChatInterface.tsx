import { useState, useRef, useEffect } from "react";
import {
  Box,
  Text,
  Stack,
  Group,
  TextInput,
  Button,
  ActionIcon,
  Drawer,
  ScrollArea,
  Loader,
  Title,
  Divider,
} from "@mantine/core";
import { RiMenuLine } from "react-icons/ri";
import { useQuery } from "@tanstack/react-query";
import type { LearningTopicDetailResponse } from "../types/learning_paths/api_types";
import { topicDetails } from "../api/learningPaths";
import { useParams } from "react-router-dom";

export const LearningPathChatInterface = () => {

  const { pathId } = useParams<{ pathId: string }>();
  const { subtopicId } = useParams<{ subtopicId: string }>();

  const { data: learningPathDetail, isLoading } =
    useQuery<LearningTopicDetailResponse>({
      queryKey: ["learning-path", pathId],
      queryFn: () => topicDetails(pathId!),
      enabled: !!pathId,
    });
  const [drawerOpened, setDrawerOpened] = useState(false);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Temporary placeholder chat messages
  const placeholderMessages = [
    {
      id: "1",
      sender: "assistant",
      content: "Hello! Ready to begin learning about React fundamentals?",
      timestamp: new Date().toISOString(),
    },
    {
      id: "2",
      sender: "user",
      content: "Yes! Let's get started.",
      timestamp: new Date().toISOString(),
    },
    {
      id: "3",
      sender: "assistant",
      content:
        "Great! We'll begin with the basics of components and how they compose your UI.",
      timestamp: new Date().toISOString(),
    },
  ];

  const handleSendMessage = () => {
    if (message.trim()) {
      console.log("Message sent:", message);
      setMessage("");
    }
  };

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [placeholderMessages]);

  return (
    <Box
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#f9f9f9",
      }}
    >
      {/* Top Bar */}
      <Group
        justify="space-between"
        align="center"
        p="md"
        style={{
          background: "#fff",
          borderBottom: "1px solid #e0e0e0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          zIndex: 10,
        }}
      >
        <Title order={4} c="dark">
          {learningPathDetail?.name || "Learning Path"}
        </Title>

        <ActionIcon
          variant="light"
          radius="xl"
          onClick={() => setDrawerOpened(true)}
        >
          <RiMenuLine size={20} />
        </ActionIcon>
      </Group>

      {/* Chat Section */}
      <Box
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "1rem",
        }}
      >
        {isLoading ? (
          <Group justify="center" mt="lg">
            <Loader />
          </Group>
        ) : (
          <Stack gap="sm">
            {placeholderMessages.map((msg) => (
              <Box
                key={msg.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems:
                    msg.sender === "user" ? "flex-end" : "flex-start",
                }}
              >
                <Box
                  p="sm"
                  style={{
                    backgroundColor:
                      msg.sender === "user" ? "#e3f2fd" : "#f5f5f5",
                    borderRadius: "12px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    maxWidth: "70%",
                  }}
                >
                  <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                    {msg.content}
                  </Text>
                </Box>
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

      {/* Input Section */}
      <Box
        style={{
          borderTop: "1px solid #ddd",
          padding: "0.5rem",
          background: "#fff",
        }}
      >
        <Group gap="sm" style={{ width: "100%" }}>
          <TextInput
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            style={{ flex: 1 }}
          />
          <Button onClick={handleSendMessage} disabled={!message.trim()}>
            Send
          </Button>
        </Group>
      </Box>

      {/* Drawer for Subtopics */}
      <Drawer
        opened={drawerOpened}
        onClose={() => setDrawerOpened(false)}
        position="right"
        size="md"
        title="Subtopics"
        overlayProps={{ backgroundOpacity: 0.3, blur: 3 }}
      >
        {isLoading ? (
          <Loader mt="lg" />
        ) : (
          <Box>
            <Text fw={600} mb="xs">
              {learningPathDetail?.name}
            </Text>
            {learningPathDetail?.description && (
              <Text size="sm" c="dimmed" mb="md">
                {learningPathDetail.description}
              </Text>
            )}
            <Divider mb="sm" />

            <ScrollArea h="70vh">
              <Stack gap="xs">
                {learningPathDetail?.subtopics?.map((sub) => {
                  const isActive = sub.id === subtopicId;
                  return (
                    <Box
                      key={sub.id}
                      p="sm"
                      style={{
                        borderRadius: "8px",
                        backgroundColor: isActive
                          ? "#e3f2fd"
                          : "transparent",
                        border: isActive
                          ? "1px solid #90caf9"
                          : "1px solid transparent",
                        transition: "background-color 0.2s",
                        cursor: "pointer",
                      }}
                    >
                      <Text fw={isActive ? 600 : 400}>{sub.name}</Text>
                      {sub.estimated_duration && (
                        <Text size="xs" c="dimmed">
                          {sub.estimated_duration}
                        </Text>
                      )}
                    </Box>
                  );
                })}
              </Stack>
            </ScrollArea>
          </Box>
        )}
      </Drawer>
    </Box>
  );
};

export default LearningPathChatInterface;

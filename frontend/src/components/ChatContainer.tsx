import { useParams } from "react-router-dom";
import {
  Box,
  Text,
  Button,
  Stack,
  Group,
  Alert,
  Loader,
  Textarea,
  Badge,
  UnstyledButton,
} from "@mantine/core";
import { useState, useMemo, useEffect, useRef } from "react";
import { FaExclamationCircle, FaArrowLeft, FaRedo } from "react-icons/fa";
import { useWebSocket } from "../hooks/useWebSocket";
import { getConversation } from "../api/conversation";
import type { ConversationResponse } from "../types/ai_core/api_types";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { CodeDrawer } from "./CodeDrawer";
import { RiCodeBoxLine } from "react-icons/ri";
import { runCode } from "../api/execution";
import type { TestCaseInput, TestCaseResult } from "../types/execution/api_types";
import { ChatBubble, EmptyState, ChatSkeleton } from "./ui";

export const ChatContainer = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages: liveMessages,
    sendMessage,
    regenerate,
    isConnected,
    isTyping,
  } = useWebSocket(conversationId!);

  const { data: conversation, isLoading } = useQuery<ConversationResponse>({
    queryKey: ["conversation", conversationId],
    queryFn: () => getConversation(conversationId!),
    enabled: !!conversationId,
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeCode, setActiveCode] = useState<{ content: string; language: string; messageId: string } | null>(null);
  const [executionOutput, setExecutionOutput] = useState<string>("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [testResults, setTestResults] = useState<TestCaseResult[] | null>(null);
  const [testSummary, setTestSummary] = useState<{ passed: number; total: number; all_passed: boolean } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const allMessages = useMemo(() => {
    if (!conversation?.messages) {
      return [];
    }
    const messageIds = new Set(conversation?.messages.map((m) => m.id));
    const uniqueLiveMessages = liveMessages.filter((m) => !messageIds.has(m.id));

    const history = conversation?.messages ?? [];
    return [...history, ...uniqueLiveMessages].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [conversation, liveMessages]);

  const lastMsg = allMessages[allMessages.length - 1];
  const danglingUserMsg = !!lastMsg && lastMsg.sender === "user" && !isTyping;

  const handleSendMessage = () => {
    if (message.trim() && isConnected) {
      sendMessage({ message });
      setMessage("");
    }
  };

  const handleRunCode = async (code: string, language: string) => {
    setIsExecuting(true);
    setExecutionOutput("");
    try {
      const response = await runCode({ code, language, conversation_id: conversationId });
      const fullOutput = response.output ? response.output : `Error: ${response.error}`;
      setExecutionOutput(fullOutput);
    } catch (e) {
      if (typeof e === "string") {
        setExecutionOutput(e.toUpperCase());
      } else if (e instanceof Error) {
        setExecutionOutput(e.message);
      }
    } finally {
      setIsExecuting(false);
    }
  };

  const handleRunTests = async (code: string, language: string, testCases: TestCaseInput[]) => {
    setIsTesting(true);
    setTestResults(null);
    try {
      const response = await runCode({ code, language, test_cases: testCases, conversation_id: conversationId });
      setTestResults(response.test_results ?? null);
      setTestSummary(response.summary ?? null);
      setExecutionOutput(response.output);
    } catch (e) {
      setTestSummary(null);
      if (e instanceof Error) {
        setExecutionOutput(e.message);
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmitCode = async (code: string, language: string, message?: string) => {
    if (isConnected) {
      sendMessage({
        message: message || "",
        code_snippet: code,
        language,
      });
      setIsDrawerOpen(false);
    }
  };

  const handleManualOpenCodeDrawer = () => {
    const MANUAL_CODE_KEY = "manual-code-session";
    let manualCodeId = sessionStorage.getItem(MANUAL_CODE_KEY);
    if (!manualCodeId) {
      manualCodeId = `manual-${crypto.randomUUID()}`;
      sessionStorage.setItem(MANUAL_CODE_KEY, manualCodeId);
    }

    let existingCode = "";
    const storedCodeObject = sessionStorage.getItem("codeStorage");
    if (storedCodeObject) {
      try {
        const codeStorage = JSON.parse(storedCodeObject);
        existingCode = codeStorage[manualCodeId] || "";
      } catch (e) {
        console.error("Error parsing code storage", e);
      }
    }

    setActiveCode({ content: existingCode, language: "python", messageId: manualCodeId });
    setExecutionOutput("");
    setIsDrawerOpen(true);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages, isTyping]);

  return (
    <>
      <Box
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          background: "var(--app-bg)",
        }}
      >
        <Box
          px={{ base: "md", md: "lg" }}
          py="sm"
          style={{
            flexShrink: 0,
            background: "var(--app-surface)",
            borderBottom: "1px solid var(--app-line)",
          }}
        >
          <Group justify="space-between" wrap="nowrap">
            <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
              <ActionIconBack onNavigate={() => navigate("/")} />
              <Box style={{ minWidth: 0 }}>
                <Text fw={650} size="md" lineClamp={1}>
                  {conversation?.title || "New conversation"}
                </Text>
                <Text size="xs" c="dimmed">
                  General chat
                </Text>
              </Box>
            </Group>
            <Group gap="xs" wrap="nowrap">
              {!isConnected && (
                <Badge size="sm" color="red" variant="light" leftSection={<FaExclamationCircle size={10} />}>
                  reconnecting
                </Badge>
              )}
              <Button
                variant="light"
                leftSection={<RiCodeBoxLine size={16} />}
                onClick={handleManualOpenCodeDrawer}
                title="Open code editor"
              >
                Code
              </Button>
            </Group>
          </Group>
        </Box>

        {!isConnected && (
          <Alert icon={<FaExclamationCircle size={16} />} title="Connection Lost" color="red" mx="lg" mt="md" mb="xs">
            Trying to reconnect to the server...
          </Alert>
        )}

        <Box style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "1rem 0" }}>
          {isLoading ? (
            <ChatSkeleton />
          ) : allMessages.length === 0 && !isTyping ? (
            <EmptyState
              icon={<RiCodeBoxLine />}
              iconColor="indigo"
              title="Start the conversation"
              description="Chat with your AI tutor. Use the Code editor to write, run, and submit python code alongside your messages."
            />
          ) : (
            <Stack gap="md" px={{ base: "md", md: "lg" }} className="app-stagger">
              {allMessages.map((msg) => (
                <Box key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: msg.sender === "user" ? "flex-end" : "flex-start" }}>
                  <ChatBubble sender={msg.sender as "user" | "ai"}>
                    {msg.code_snippet && msg.language ? (
                      <Stack gap="xs">
                        {msg.content && (
                          <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                            {msg.content}
                          </Text>
                        )}
                        <Button
                          variant="subtle"
                          size="xs"
                          color="indigo"
                          leftSection={<RiCodeBoxLine size={14} />}
                          onClick={() => {
                            setActiveCode({
                              content: msg.code_snippet!,
                              language: msg.language!,
                              messageId: msg.id,
                            });
                            setExecutionOutput("");
                            setIsDrawerOpen(true);
                          }}
                        >
                          View &amp; Run Code ({msg.language})
                        </Button>
                      </Stack>
                    ) : (
                      <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                        {msg.content}
                      </Text>
                    )}
                  </ChatBubble>
                  <Text size="xs" c="dimmed" mt={4}>
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </Text>
                </Box>
              ))}

              {isTyping && (
                <Box style={{ display: "flex" }}>
                  <ChatBubble sender="ai">
                    <Loader size="sm" type="dots" />
                  </ChatBubble>
                </Box>
              )}
              <div ref={messagesEndRef} />
            </Stack>
          )}
        </Box>

        <Box
          p="sm"
          px={{ base: "md", md: "lg" }}
          style={{
            borderTop: "1px solid var(--app-line)",
            background: "var(--app-surface)",
            flexShrink: 0,
          }}
        >
          {danglingUserMsg && (
            <Group gap="xs" p="xs" mb="xs" justify="space-between" wrap="nowrap" style={{ borderRadius: 8, background: "var(--mantine-color-orange-light)" }}>
              <Text size="xs" c="dimmed" lineClamp={1}>
                No response yet — the connection may have dropped.
              </Text>
              <Group gap={6} wrap="nowrap">
                <Button size="compact-xs" variant="light" color="orange" leftSection={<FaRedo size={10} />} disabled={!isConnected} onClick={regenerate}>
                  Get response
                </Button>
                <Button size="compact-xs" variant="subtle" color="gray" onClick={() => setMessage(lastMsg.content)}>
                  Edit
                </Button>
              </Group>
            </Group>
          )}
          <Group gap="sm" align="flex-end" wrap="nowrap">
            <Textarea
              placeholder="Type your message..."
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
              minRows={1}
              maxRows={8}
            />
            <Button onClick={handleSendMessage} disabled={!isConnected || !message.trim() || isTyping}>
              Send
            </Button>
          </Group>
        </Box>
      </Box>
      <CodeDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        code={activeCode?.content ?? ""}
        language={activeCode?.language ?? "plaintext"}
        executionOutput={executionOutput}
        isExecuting={isExecuting}
        onRunCode={handleRunCode}
        onSubmitCode={handleSubmitCode}
        messageId={activeCode?.messageId}
        onRunTests={handleRunTests}
        testResults={testResults}
        testSummary={testSummary}
        isTesting={isTesting}
      />
    </>
  );
};

const ActionIconBack = ({ onNavigate }: { onNavigate: () => void }) => (
  <UnstyledButton
    aria-label="Back"
    onClick={onNavigate}
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: 34,
      height: 34,
      borderRadius: "var(--mantine-radius-md)",
      color: "var(--mantine-color-dimmed)",
      flexShrink: 0,
    }}
    className="nav-item"
  >
    <FaArrowLeft size={15} />
  </UnstyledButton>
);
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
} from "@mantine/core";
import { useState, useMemo, useEffect, useRef } from "react";
import { FaExclamationCircle } from "react-icons/fa";
import { useWebSocket } from "../hooks/useWebSocket";
import { getConversation } from "../api/conversation";
import type { ConversationResponse } from "../types/ai_core/api_types";
import { useQuery } from "@tanstack/react-query";

import { CodeDrawer } from "./CodeDrawer";
import { RiCodeBoxLine } from "react-icons/ri";
import { runCode } from "../api/execution";
import type { TestCaseInput, TestCaseResult } from "../types/execution/api_types";

export const ChatContainer = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // WebSocket and historical data fetching
  const {
    messages: liveMessages,
    sendMessage,
    isConnected,
    isTyping,
  } = useWebSocket(conversationId!);

  const { data: conversation } = useQuery<ConversationResponse>({
    queryKey: ["conversation", conversationId],
    queryFn: () => getConversation(conversationId!),
    enabled: !!conversationId,
  });

  // State for the Code Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeCode, setActiveCode] = useState<{ content: string; language: string; messageId: string; } | null>(null);
  const [executionOutput, setExecutionOutput] = useState<string>("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [testResults, setTestResults] = useState<TestCaseResult[] | null>(null);
  const [testSummary, setTestSummary] = useState<{ passed: number; total: number; all_passed: boolean } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const allMessages = useMemo(() => {
    if (!conversation?.messages) 
    {
      return []
    }
    const messageIds = new Set(conversation?.messages.map(m => m.id));
    const uniqueLiveMessages = liveMessages.filter(m => !messageIds.has(m.id));

    const history = conversation?.messages ?? [];
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

  // Open a fresh code editor for the user to write/run their own code
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

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages, isTyping]);

  return (
    <>
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
          <Alert icon={<FaExclamationCircle size={16} />} title="Connection Lost" color="red" mb="md">
            Trying to reconnect to the server...
          </Alert>
        )}

        <Box style={{ flex: 1, minHeight: 0, overflowY: "auto", paddingBottom: "1rem" }}>
          {allMessages.length === 0 && !isTyping ? (
            <Text c="dimmed" ta="center" pt="xl">Start a new conversation</Text>
          ) : (
            <Stack gap="sm">
              {allMessages.map((msg) => (
                <Box key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: msg.sender === "user" ? "flex-end" : "flex-start" }}>
                  <Box p="sm" style={{ backgroundColor: msg.sender === "user" ? "#e3f2fd" : "#f5f5f5", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", maxWidth: "70%" }}>
                    {msg.code_snippet && msg.language ? (
                      <Stack gap="xs">
                        {msg.content && <Text size="sm">{msg.content}</Text>}
                        <Button
                          variant="light"
                          size="xs"
                          leftSection={<RiCodeBoxLine size={16} />}
                          onClick={() => {
                            setActiveCode({
                              content: msg.code_snippet!,
                              language: msg.language!,
                              messageId: msg.id,
                            });
                            setExecutionOutput(""); // Clear previous output
                            setIsDrawerOpen(true);
                          }}
                        >
                          View & Run Code ({msg.language})
                        </Button>
                      </Stack>
                    ) : (
                      <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>{msg.content}</Text>
                    )}

                  </Box>
                  <Text size="xs" c="dimmed" ta={msg.sender === "user" ? "right" : "left"} style={{ marginTop: "2px" }}>
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </Text>
                </Box>
              ))}

              {isTyping && (
                <Group gap="xs" style={{ alignSelf: 'flex-start' }}>
                  <Box p="sm" style={{ backgroundColor: "#f5f5f5", borderRadius: "12px" }}>
                    <Loader size="sm" type="dots" />
                  </Box>
                </Group>
              )}
              <div ref={messagesEndRef} />
            </Stack>
          )}
        </Box>

        {/* Input Area */}
        <Box style={{ borderTop: "1px solid #ddd", paddingTop: "0.5rem", paddingBottom: "0.5rem", background: "#fff", flexShrink: 0 }}>
          <Group gap="sm" style={{ width: "100%" }} align="flex-end">
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
              minRows={2}
              maxRows={8}
            />
            <Button
              variant="light"
              color="blue"
              disabled={!isConnected || isTyping}
              leftSection={<RiCodeBoxLine size={16} />}
              onClick={handleManualOpenCodeDrawer}
              title="Open code editor"
            >
              Code
            </Button>
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
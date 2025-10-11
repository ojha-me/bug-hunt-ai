import { useState, useRef, useEffect, useMemo, useCallback } from "react";
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
  Badge,
  Alert,
  Progress,
  Card,
} from "@mantine/core";
import { RiMenuLine, RiLightbulbLine, RiCheckLine, RiCodeLine } from "react-icons/ri";
import { useQuery } from "@tanstack/react-query";
import type { LearningTopicDetailResponse } from "../types/learning_paths/api_types";
import { topicDetails, getLearningPathMessages } from "../api/learningPaths";
import { useParams } from "react-router-dom";
import { useLearningPathWebSocket, type SubtopicProgress } from "../hooks/useLearningPathWebSocket";
import { CodeDrawer } from "./CodeDrawer";
import { runCode } from "../api/execution";
import ReactMarkdown from "react-markdown";

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

export const LearningPathChatInterface = () => {

  const { learningTopicId } = useParams<{ learningTopicId: string }>();

  const { data: learningPathDetail, isLoading } =
    useQuery<LearningTopicDetailResponse>({
      queryKey: ["user-learning-paths", learningTopicId],
      queryFn: () => topicDetails(learningTopicId!),
      enabled: !!learningTopicId,
    });
  
  // Fetch historical messages from the database
  const { data: historicalMessages } = useQuery({
    queryKey: ["learning-path-messages", learningTopicId],
    queryFn: () => getLearningPathMessages(learningTopicId!),
    enabled: !!learningTopicId,
  });

  // State for live messages from WebSocket
  const [liveMessages, setLiveMessages] = useState<LearningPathMessage[]>([]);

  // State for progress tracking
  const [currentProgress, setCurrentProgress] = useState<SubtopicProgress | null>(null);

  // Callback to handle new messages from WebSocket
  const handleNewMessage = useCallback((message: LearningPathMessage) => {
    setLiveMessages((prev) => {
      // Check if message already exists to prevent duplicates
      const exists = prev.some(m => m.id === message.id);
      if (exists) {
        return prev;
      }
      return [...prev, message];
    });
  }, []);

  const [showNextSubtopicButton, setShowNextSubtopicButton] = useState(false);

  const handleSubtopicComplete = useCallback(() => {
    setShowNextSubtopicButton(true);
  }, []);

  const handleProgressUpdate = useCallback((progress: SubtopicProgress) => {
    setCurrentProgress(progress);
  }, []);

  const handleReadyForNext = useCallback(() => {
    setShowNextSubtopicButton(true);
  }, []);

  const handleSubtopicChanged = useCallback((data: { new_subtopic: string; completed_subtopic: string }) => {
    console.log("Subtopic changed:", data);
    setCurrentProgress(null);
    setShowNextSubtopicButton(false);
  }, []);

  const {
    isConnected,
    isTyping,
    sendMessage,
    moveToNextSubtopic,
  } = useLearningPathWebSocket(
    learningTopicId!, 
    handleNewMessage, 
    handleSubtopicComplete, 
    handleProgressUpdate, 
    handleReadyForNext,
    handleSubtopicChanged
  );

  // merge the live messages and the historical messages.
  const allMessages = useMemo(() => {
    if (!historicalMessages) {
      return liveMessages;
    }
    
    // Parse historical messages to handle any JSON content
    const parsedHistoricalMessages = (historicalMessages as LearningPathMessage[]).map((msg) => {
      let content = msg.content;
      let type = msg.type;
      let next_action = msg.next_action;
      
      // Try to parse content as JSON (fallback if backend didn't parse it)
      try {
        if (typeof content === 'string' && content.trim().startsWith('{')) {
          const parsed = JSON.parse(content);
          if (parsed.content) {
            content = parsed.content;
            type = parsed.type || type;
            next_action = parsed.next_action || next_action;
          }
        }
      } catch {
        // If parsing fails, use content as-is
      }
      
      return { ...msg, content, type, next_action };
    });
    
    // Create a Set of historical message IDs for quick lookup
    const historicalMessageIds = new Set(parsedHistoricalMessages.map((m) => m.id));
    
    // Filter out live messages that are already in historical messages
    const uniqueLiveMessages = liveMessages.filter(m => !historicalMessageIds.has(m.id));
    
    // Combine and sort by timestamp
    return [...parsedHistoricalMessages, ...uniqueLiveMessages].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [historicalMessages, liveMessages]);

  const [drawerOpened, setDrawerOpened] = useState(false);
  const [message, setMessage] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [showCodeInput, setShowCodeInput] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Code drawer state
  const [codeDrawerOpen, setCodeDrawerOpen] = useState(false);
  const [currentCode, setCurrentCode] = useState("");
  const [currentLanguage, setCurrentLanguage] = useState("python");
  const [currentMessageId, setCurrentMessageId] = useState<string | undefined>(undefined);
  const [executionOutput, setExecutionOutput] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);

  // Handle sending messages
  const handleSendMessage = () => {
    if (!message.trim() || !isConnected) return;
    
    sendMessage(message);
    setMessage("");
  };

  // Handle sending code submissions
  const handleSendCode = () => {
    if (!codeInput.trim() || !isConnected) return;
    
    sendMessage("Here's my code solution:", codeInput, "python");
    setCodeInput("");
    setShowCodeInput(false);
  };

  // Handle opening code drawer with AI-provided code
  const handleOpenCodeDrawer = (code: string, language: string, messageId: string) => {
    setCurrentCode(code);
    setCurrentLanguage(language);
    setCurrentMessageId(messageId);
    setExecutionOutput("");
    setCodeDrawerOpen(true);
  };

  // Handle running code
  const handleRunCode = async (code: string, language: string) => {
    setIsExecuting(true);
    try {
      const result = await runCode({ code, language });
      setExecutionOutput(result.output || result.error || "No output");
    } catch (error) {
      setExecutionOutput(`Error: ${error}`);
    } finally {
      setIsExecuting(false);
    }
  };

  // Handle submitting code to AI
  const handleSubmitCode = (code: string, language: string, userMessage?: string) => {
    const messageText = userMessage || "Here's my code solution:";
    sendMessage(messageText, code, language);
    setCodeDrawerOpen(false);
  };


  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages]);

  // Show code input for challenges
  useEffect(() => {
    const lastMessage = allMessages[allMessages.length - 1];
    if (lastMessage?.sender === "ai" && lastMessage?.type === "challenge") {
      setShowCodeInput(true);
    }
  }, [allMessages]);

  return (
    <Box
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#f9f9f9",
      }}
    >
      {/* Top Bar with Progress */}
      <Box
        style={{
          background: "#fff",
          borderBottom: "1px solid #e0e0e0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          zIndex: 10,
        }}
      >
        <Group justify="space-between" align="center" p="md">
          <Box style={{ flex: 1 }}>
            <Title order={4} c="dark">
              {learningPathDetail?.name || "Learning Path"}
            </Title>
              <Group gap="xs" mt="xs">
                <Badge size="sm" color={isConnected ? "green" : "red"}>
                  {isConnected ? "Connected" : "Disconnected"}
                </Badge>
                {currentProgress && (
                  <Badge size="sm" color="blue" variant="light">
                    {currentProgress.progress_percentage.toFixed(0)}% Complete
                  </Badge>
                )}
              </Group>
          </Box>

          <ActionIcon
            variant="light"
            radius="xl"
            onClick={() => setDrawerOpened(true)}
          >
            <RiMenuLine size={20} />
          </ActionIcon>
        </Group>
        
        {/* Progress Bar */}
        {currentProgress && (
          <Box px="md" pb="sm">
            <Progress 
              value={currentProgress.progress_percentage} 
              size="sm" 
              color={currentProgress.is_ready_to_move_on ? "green" : "blue"}
              animated={!currentProgress.is_ready_to_move_on}
            />
          </Box>
        )}
      </Box>

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
            { allMessages.length === 0 && (
              <Alert color="blue" title="Preparing your learning journey...">
                Your AI tutor is getting ready to guide you through this topic. This will just take a moment!
              </Alert>
            )}

            {allMessages.map((msg: LearningPathMessage) => (
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
                    backgroundColor: msg.sender === "user" ? "#e3f2fd" : "#f5f5f5",
                    borderRadius: "12px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    maxWidth: "70%",
                    position: "relative",
                  }}
                >
                  {/* Message type indicator for AI messages */}
                  {msg.sender === "ai" && msg.type && (
                    <Group gap="xs" mb="xs">
                      <Text size="xs">
                        {""}
                      </Text>
                      <Badge size="xs" variant="light">
                        {msg.type}
                      </Badge>
                    </Group>
                  )}

                  <ReactMarkdown>
                    {msg.content}
                  </ReactMarkdown>

                  {msg.code_snippet && (
                    <Box mt="sm">
                      <Box
                        p="sm"
                        style={{
                          backgroundColor: "#f8f9fa",
                          borderRadius: "8px",
                          fontFamily: "monospace",
                          fontSize: "12px",
                          border: "1px solid #e9ecef",
                        }}
                      >
                        <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                          {msg.code_snippet}
                        </pre>
                      </Box>
                      <Button
                        size="xs"
                        variant="light"
                        leftSection={<RiCodeLine size={14} />}
                        mt="xs"
                        onClick={() => handleOpenCodeDrawer(msg.code_snippet!, msg.language || "python", msg.id)}
                      >
                        Open in Editor
                      </Button>
                    </Box>
                  )}

                  {/* Next action suggestion */}
                  {msg.next_action && (
                    <Text size="xs" c="dimmed" mt="xs" style={{ fontStyle: "italic" }}>
                      💡 {msg.next_action}
                    </Text>
                  )}
                </Box>

                <Group gap="xs" mt="xs">
                  <Text
                    size="xs"
                    c="dimmed"
                    ta={msg.sender === "user" ? "right" : "left"}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </Text>

                  {/* Action buttons for AI messages */}
                  {msg.sender === "ai" && msg.type === "challenge" && (
                    <Button
                      size="xs"
                      variant="light"
                      leftSection={<RiLightbulbLine size={12} />}
                    >
                      Hint
                    </Button>
                  )}
                </Group>
              </Box>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <Box
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                }}
              >
                <Box
                  p="sm"
                  style={{
                    backgroundColor: "#f5f5f5",
                    borderRadius: "12px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  }}
                >
                  <Group gap="xs">
                    <Loader size="xs" />
                    <Text size="sm" c="dimmed">
                      AI is thinking...
                    </Text>
                  </Group>
                </Box>
              </Box>
            )}

            <div ref={messagesEndRef} />
          </Stack>
        )}
      </Box>

      {/* Code Input Section (shown for challenges) */}
      {showCodeInput && (
        <Box
          style={{
            borderTop: "1px solid #ddd",
            padding: "0.5rem",
            background: "#fff8e1",
          }}
        >
          <Text size="sm" mb="xs" fw={500}>
            💻 Submit your code solution:
          </Text>
          <Group gap="sm" style={{ width: "100%" }}>
            <TextInput
              placeholder="Write your code here..."
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              style={{ flex: 1 }}
              styles={{
                input: {
                  fontFamily: "monospace",
                  fontSize: "12px",
                },
              }}
            />
            <Button
              disabled={!codeInput.trim() || !isConnected}
              leftSection={<RiCheckLine size={14} />}
              onClick={handleSendCode}
            >
              Submit
            </Button>
            <Button
              variant="light"
              onClick={() => setShowCodeInput(false)}
            >
              Cancel
            </Button>
          </Group>
        </Box>
      )}

      {showNextSubtopicButton && (
        <Box
          style={{
            borderTop: "2px solid #4caf50",
            padding: "1rem",
            background: "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)",
            boxShadow: "0 -2px 8px rgba(76, 175, 80, 0.2)",
          }}
        >
          <Group justify="space-between" align="center">
            <Box>
              <Text size="md" fw={600} c="green.9">
                🎉 Congratulations! You're ready!
              </Text>
              <Text size="sm" c="green.8" mt={4}>
                You've mastered this subtopic. Continue to the next one!
              </Text>
            </Box>
            <Button
              size="md"
              color="green"
              variant="filled"
              onClick={() => {
                moveToNextSubtopic();
                setShowNextSubtopicButton(false);
              }}
              styles={{
                root: {
                  fontWeight: 600,
                  boxShadow: "0 2px 8px rgba(76, 175, 80, 0.3)",
                }
              }}
            >
              Next Topic →
            </Button>
          </Group>
        </Box>
      )}

      {/* Regular Input Section */}
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
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            style={{ flex: 1 }}
            disabled={!isConnected}
          />
          <Button
            disabled={!message.trim() || !isConnected}
            onClick={handleSendMessage}
          >
            Send
          </Button>
        </Group>
      </Box>

      <Drawer
        opened={drawerOpened}
        onClose={() => setDrawerOpened(false)}
        position="right"
        size="md"
        title="Learning Progress"
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

            {/* Current Progress Card */}
            {currentProgress && (
              <Card shadow="sm" p="md" mb="md" withBorder>
                <Text fw={600} mb="sm">Current Subtopic Progress</Text>
                
                <Stack gap="xs">
                  <Box>
                    <Group justify="space-between" mb="xs">
                      <Text size="sm" fw={500}>Overall Progress</Text>
                      <Text size="sm" fw={600} c="blue">
                        {currentProgress.progress_percentage.toFixed(0)}%
                      </Text>
                    </Group>
                    <Progress 
                      value={currentProgress.progress_percentage} 
                      size="md" 
                      color={currentProgress.is_ready_to_move_on ? "green" : "blue"}
                    />
                  </Box>

                  <Box>
                    <Group justify="space-between" mb="xs">
                      <Text size="sm" fw={500}>AI Confidence</Text>
                      <Text size="sm" fw={600} c={currentProgress.ai_confidence >= 0.8 ? "green" : "orange"}>
                        {(currentProgress.ai_confidence * 100).toFixed(0)}%
                      </Text>
                    </Group>
                    <Progress 
                      value={currentProgress.ai_confidence * 100} 
                      size="md" 
                      color={currentProgress.ai_confidence >= 0.8 ? "green" : "orange"}
                    />
                  </Box>

                  {currentProgress.challenges_attempted > 0 && (
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Challenges</Text>
                      <Text size="sm" fw={500}>
                        {currentProgress.challenges_completed}/{currentProgress.challenges_attempted}
                      </Text>
                    </Group>
                  )}

                  {currentProgress.covered_points.length > 0 && (
                    <Box>
                      <Text size="sm" fw={500} mb="xs">Covered Concepts</Text>
                      <Stack gap={4}>
                        {currentProgress.covered_points.map((point, idx) => (
                          <Group key={idx} gap="xs">
                            <RiCheckLine size={14} color="green" />
                            <Text size="xs">{point}</Text>
                          </Group>
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {currentProgress.remaining_points.length > 0 && (
                    <Box>
                      <Text size="sm" fw={500} mb="xs">Remaining Concepts</Text>
                      <Stack gap={4}>
                        {currentProgress.remaining_points.map((point, idx) => (
                          <Text key={idx} size="xs" c="dimmed" pl="md">
                            • {point}
                          </Text>
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {currentProgress.is_ready_to_move_on && (
                    <Alert color="green" title="Ready to Advance!">
                      You've mastered this subtopic! You can move on when ready.
                    </Alert>
                  )}
                </Stack>
              </Card>
            )}

            <Text fw={600} mb="sm">All Subtopics</Text>
            <ScrollArea h="40vh">
              <Stack gap="xs">
                {learningPathDetail?.subtopics?.map((sub) => {
                  const isActive = false;
                  const isCompleted = false;
                  
                  return (
                    <Box
                      key={sub.id}
                      p="sm"
                      style={{
                        borderRadius: "8px",
                        backgroundColor: isActive
                          ? "#e3f2fd"
                          : isCompleted
                          ? "#e8f5e8"
                          : "transparent",
                        border: isActive
                          ? "1px solid #90caf9"
                          : isCompleted
                          ? "1px solid #81c784"
                          : "1px solid transparent",
                        transition: "background-color 0.2s",
                        cursor: "pointer",
                      }}
                    >
                      <Group justify="space-between">
                        <Box style={{ flex: 1 }}>
                          <Text fw={isActive ? 600 : 400}>{sub.name}</Text>
                          {sub.estimated_duration && (
                            <Text size="xs" c="dimmed">
                              {sub.estimated_duration}
                            </Text>
                          )}
                        </Box>
                        {isCompleted && (
                          <RiCheckLine color="green" size={16} />
                        )}
                        {isActive && (
                          <Badge size="xs" color="blue">
                            Current
                          </Badge>
                        )}
                      </Group>
                    </Box>
                  );
                })}
              </Stack>
            </ScrollArea>
          </Box>
        )}
      </Drawer>

      <CodeDrawer
        isOpen={codeDrawerOpen}
        onClose={() => setCodeDrawerOpen(false)}
        code={currentCode}
        language={currentLanguage}
        executionOutput={executionOutput}
        isExecuting={isExecuting}
        onRunCode={handleRunCode}
        onSubmitCode={handleSubmitCode}
        messageId={currentMessageId}
      />
    </Box>
  );
};

export default LearningPathChatInterface;

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
  Paper,
  Textarea,
} from "@mantine/core";
import { RiMenuLine, RiCheckLine, RiSkipForwardLine, RiArrowRightLine, RiCodeLine } from "react-icons/ri";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { LearningTopicDetailResponse, UserLearningPathResponse } from "../types/learning_paths/api_types";
import { topicDetails, getSubtopicMessages, userLearningPaths, skipSubtopic } from "../api/learningPaths";
import { useParams } from "react-router-dom";
import { useLearningPathWebSocket, type SubtopicProgress } from "../hooks/useLearningPathWebSocket";
import { CodeDrawer } from "./CodeDrawer";
import { LearningPathMessage as MessageComponent } from "./LearningPathMessage";
import { runCode } from "../api/execution";
import type { TestCaseInput, TestCaseResult } from "../types/execution/api_types";

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
  const queryClient = useQueryClient();
  const { learningTopicId } = useParams<{ learningTopicId: string }>();
  const [currentSubtopicId, setCurrentSubtopicId] = useState<string | null>(null);

  const { data: learningPathDetail, isLoading } =
    useQuery<LearningTopicDetailResponse>({
      queryKey: ["learning-topic-detail", learningTopicId],
      queryFn: () => topicDetails(learningTopicId!),
      enabled: !!learningTopicId,
    });
  
  // Fetch user's learning path progress
  const { data: userLearningPathData } = useQuery<UserLearningPathResponse[]>({
    queryKey: ["user-learning-paths", learningTopicId],
    queryFn: () => userLearningPaths(learningTopicId),
    enabled: !!learningTopicId,
  });

  const userLearningPath = userLearningPathData?.[0];

  // Set initial subtopic from user's current progress
  useEffect(() => {
    if (userLearningPath?.current_subtopic && !currentSubtopicId) {
      setCurrentSubtopicId(userLearningPath.current_subtopic.id);
    }
  }, [userLearningPath, currentSubtopicId]);

  // Clear live messages when switching subtopics
  useEffect(() => {
    setLiveMessages([]);
    setCurrentProgress(null);
  }, [currentSubtopicId]);
  
  // Fetch historical messages from the database for current subtopic
  const { data: historicalMessages } = useQuery({
    queryKey: ["subtopic-messages", learningTopicId, currentSubtopicId],
    queryFn: () => getSubtopicMessages(learningTopicId!, currentSubtopicId!),
    enabled: !!learningTopicId && !!currentSubtopicId,
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
      if (message.sender === "user") {
        const filtered = prev.filter(m => 
          !(m.sender === "user" && m.id.startsWith("temp-") && m.content === message.content)
        );
        return [...filtered, message];
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
    currentSubtopicId!,
    handleNewMessage, 
    handleSubtopicComplete, 
    handleProgressUpdate, 
    handleReadyForNext,
    handleSubtopicChanged
  );

  // Skip subtopic mutation
  const skipMutation = useMutation({
    mutationFn: ({ topicId, subtopicId }: { topicId: string; subtopicId: string }) =>
      skipSubtopic(topicId, subtopicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-learning-paths", learningTopicId] });
      // Move to next subtopic
      const currentSubtopic = userLearningPath?.progress.find(p => p.subtopic.id === currentSubtopicId);
      if (currentSubtopic) {
        const nextSubtopic = userLearningPath?.progress.find(
          p => p.subtopic.order > currentSubtopic.subtopic.order
        );
        if (nextSubtopic) {
          setCurrentSubtopicId(nextSubtopic.subtopic.id);
        }
      }
    },
  });

  const handleSkipSubtopic = () => {
    if (currentSubtopicId && learningTopicId) {
      skipMutation.mutate({ topicId: learningTopicId, subtopicId: currentSubtopicId });
    }
  };

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
  const [testResults, setTestResults] = useState<TestCaseResult[] | null>(null);
  const [testSummary, setTestSummary] = useState<{ passed: number; total: number; all_passed: boolean } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Handle sending messages
  const handleSendMessage = () => {
    if (!message.trim() || !isConnected || !currentSubtopicId) {
      return;
    }
    
    const userMessage: LearningPathMessage = {
      id: `temp-${Date.now()}`,
      sender: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };
    setLiveMessages((prev) => [...prev, userMessage]);
    
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

  // Handle manually opening code drawer
  const handleManualOpenCodeDrawer = () => {
    // Check if there's already a manual code session in storage
    const MANUAL_CODE_KEY = "manual-code-session";
    let manualCodeId = sessionStorage.getItem(MANUAL_CODE_KEY);
    
    if (!manualCodeId) {
      // Generate a UUID for manual code sessions to enable persistence
      manualCodeId = `manual-${crypto.randomUUID()}`;
      sessionStorage.setItem(MANUAL_CODE_KEY, manualCodeId);
    }
    
    // Try to load existing code from storage
    const storedCodeObject = sessionStorage.getItem("codeStorage");
    let existingCode = "";
    if (storedCodeObject) {
      try {
        const codeStorage = JSON.parse(storedCodeObject);
        existingCode = codeStorage[manualCodeId] || "";
      } catch (e) {
        console.error("Error parsing code storage", e);
      }
    }
    
    setCurrentCode(existingCode);
    setCurrentLanguage("python");
    setCurrentMessageId(manualCodeId);
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

  const handleRunTests = async (code: string, language: string, testCases: TestCaseInput[]) => {
    setIsTesting(true);
    setTestResults(null);
    try {
      const result = await runCode({ code, language, test_cases: testCases });
      setTestResults(result.test_results ?? null);
      setTestSummary(result.summary ?? null);
      setExecutionOutput(result.output || result.error || "No output");
    } catch (error) {
      setTestSummary(null);
      setExecutionOutput(`Error: ${error}`);
    } finally {
      setIsTesting(false);
    }
  };

  // Handle submitting code to AI
  const handleSubmitCode = (code: string, language: string, userMessage?: string) => {
    const messageText = userMessage || "Here's my code solution:";
    sendMessage(messageText, code, language);
    setCodeDrawerOpen(false);
  };


  // Auto-scroll to latest message or when typing indicator changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages, isTyping]);

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
        background: "var(--app-bg)",
      }}
    >
      {/* Top Bar with Progress */}
      <Box
        style={{
          background: "var(--app-surface)",
          borderBottom: "1px solid var(--app-line)",
          zIndex: 10,
        }}
      >
        <Group justify="space-between" align="center" p="md">
          <Box style={{ flex: 1 }}>
            <Title order={4}>
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
          minHeight: 0,
          overflowY: "auto",
          padding: "1rem",
        }}
      >
        {isLoading ? (
          <Group justify="center" mt="lg">
            <Loader />
          </Group>
        ) : (
          <Stack gap="sm" className="app-stagger">
            { allMessages.length === 0 && (
              <Alert color="blue" title="Preparing your learning journey...">
                Your AI tutor is getting ready to guide you through this topic. This will just take a moment!
              </Alert>
            )}

            {allMessages.map((msg: LearningPathMessage) => (
              <MessageComponent
                key={msg.id}
                id={msg.id}
                sender={msg.sender}
                content={msg.content}
                code_snippet={msg.code_snippet}
                language={msg.language}
                timestamp={msg.timestamp}
                type={msg.type}
                next_action={msg.next_action}
                onOpenCodeDrawer={handleOpenCodeDrawer}
                onHint={() => sendMessage("Give me a hint for the current challenge.", undefined, undefined)}
              />
            ))}

            {isTyping && (
              <Box
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                }}
              >
                <Box
                  p="sm"
                  className="app-bubble"
                  style={{
                    backgroundColor: "var(--app-sunken)",
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

      {showCodeInput && (
        <Box
          style={{
            borderTop: "1px solid var(--app-line)",
            padding: "0.75rem 1rem",
            background: "var(--mantine-color-yellow-1)",
          }}
        >
          <Text size="sm" mb="xs" fw={600}>
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
            borderTop: "2px solid var(--mantine-color-green-6)",
            padding: "1rem",
            background: "var(--mantine-color-green-1)",
            boxShadow: "0 -2px 12px var(--mantine-color-green-6)",
          }}
        >
          <Group justify="space-between" align="center" wrap="nowrap">
            <Box>
              <Group gap="xs">
                <Text size="md" fw={650}>🎉</Text>
                <Text size="md" fw={650}>
                  You're ready for the next subtopic!
                </Text>
              </Group>
              <Text size="sm" mt={4}>
                You've mastered this one. Continue your learning path.
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
            >
              Next Topic &rarr;
            </Button>
          </Group>
        </Box>
      )}

      <Box
        style={{
          borderTop: "1px solid var(--app-line)",
          padding: "0.75rem 1rem",
          background: "var(--app-surface)",
          flexShrink: 0,
        }}
      >
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
            autosize
            minRows={1}
            maxRows={8}
            style={{ flex: 1 }}
            disabled={!isConnected}
          />
          <Button
            disabled={!message.trim() || !isConnected}
            onClick={handleSendMessage}
          >
            Send
          </Button>
          <Button
            variant="light"
            color="blue"
            leftSection={<RiCodeLine size={16} />}
            onClick={handleManualOpenCodeDrawer}
            title="Open code editor"
          >
            Code
          </Button>
          <Button
            variant="light"
            color="orange"
            leftSection={<RiSkipForwardLine size={16} />}
            onClick={handleSkipSubtopic}
            disabled={skipMutation.isPending}
          >
            Skip Topic
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
                  const progressItem = userLearningPath?.progress.find(p => p.subtopic.id === sub.id);
                  const isActive = currentSubtopicId === sub.id;
                  const isCompleted = progressItem?.status === 'completed';
                  const isSkipped = progressItem?.status === 'skipped';
                  
                  return (
                    <Paper
                      key={sub.id}
                      p="sm"
                      withBorder
                      style={{
                        backgroundColor: isActive
                          ? "var(--mantine-color-blue-1)"
                          : isCompleted
                          ? "var(--mantine-color-green-1)"
                          : isSkipped
                          ? "var(--mantine-color-orange-1)"
                          : "transparent",
                        borderColor: isActive
                          ? "var(--mantine-color-blue-6)"
                          : isCompleted
                          ? "var(--mantine-color-green-6)"
                          : isSkipped
                          ? "var(--mantine-color-orange-6)"
                          : "var(--app-line)",
                        cursor: "pointer",
                        transition: "background-color 150ms ease, border-color 150ms ease",
                      }}
                      onClick={() => setCurrentSubtopicId(sub.id)}
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
                          <Badge size="xs" color="green" leftSection={<RiCheckLine size={12} />}>
                            Completed
                          </Badge>
                        )}
                        {isSkipped && (
                          <Badge size="xs" color="orange">
                            Skipped
                          </Badge>
                        )}
                        {isActive && (
                          <Badge size="xs" color="blue">
                            Current
                          </Badge>
                        )}
                        {progressItem?.conversation_id && !isActive && (
                          <ActionIcon
                            size="sm"
                            variant="light"
                            color="blue"
                          >
                            <RiArrowRightLine size={14} />
                          </ActionIcon>
                        )}
                      </Group>
                    </Paper>
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
        onRunTests={handleRunTests}
        testResults={testResults}
        testSummary={testSummary}
        isTesting={isTesting}
      />
    </Box>
  );
};

export default LearningPathChatInterface;

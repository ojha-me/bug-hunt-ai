import { useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
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
  Progress,
  ScrollArea,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { FaExclamationCircle, FaLock, FaCheck, FaPlay, FaDumbbell, FaArrowLeft } from "react-icons/fa";
import { RiMicLine, RiMicOffLine } from "react-icons/ri";
import { useSDPracticeWebSocket, type PracticeMessage } from "../hooks/useSDPracticeWebSocket";
import { useSpeechToText } from "../hooks/useSpeechToText";
import { getSDPracticeSessions } from "../api/systemDesign";
import { getConversation } from "../api/conversation";
import { SystemDesignWhiteboard } from "./SystemDesignWhiteboard";
import { SystemDesignDiagram } from "./SystemDesignDiagram";
import type { SDPracticeSessionResponse } from "../types/system_design/api_types";
import {
  PRACTICE_PHASES,
  getPhaseDef,
  phaseCompleteStates,
} from "./practice/phases";
import { difficultyColor } from "./ui";

export const SystemDesignPracticeRoom = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("");

  const { supported: dictationSupported, listening: dictating, interim: dictationInterim, start: startDictation, stop: stopDictation } =
    useSpeechToText((segment) => {
      if (segment) setMessage((prev) => (prev ? `${prev.trimEnd()} ${segment}` : segment));
    });

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["sd-practice-sessions"],
    queryFn: getSDPracticeSessions,
  });

  const session: SDPracticeSessionResponse | undefined = useMemo(
    () => sessions?.find((s) => s.conversation_id === conversationId),
    [sessions, conversationId]
  );

  const { messages, sendMessage, submitDiagram, isConnected, isTyping, phaseState, sessionCompleted } =
    useSDPracticeWebSocket(conversationId ?? "");

  // The transcript is persisted server-side; load it so returning to a drill
  // shows prior messages rather than an empty room.
  const { data: conversation } = useQuery({
    queryKey: ["conversation", conversationId, "sd-practice"],
    queryFn: () => getConversation(conversationId!),
    enabled: !!conversationId,
  });

  const allMessages = useMemo<PracticeMessage[]>(() => {
    const history: PracticeMessage[] = (conversation?.messages ?? []).map((m) => ({
      id: m.id,
      sender: m.sender as "user" | "ai",
      content: m.content,
      timestamp: m.timestamp,
      diagram: m.diagram ?? undefined,
    }));
    const seen = new Set(history.map((m) => m.id));
    const merged = [...history, ...messages.filter((m) => !seen.has(m.id))];
    return merged.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [conversation, messages]);

  const currentPhase = phaseState?.current_phase ?? session?.current_phase ?? 1;
  const completedPhases = useMemo(() => phaseCompleteStates(phaseState), [phaseState]);
  const currentDef = getPhaseDef(currentPhase);

  const isCompleted = sessionCompleted || session?.status === "completed";

  const handleSendMessage = () => {
    if (message.trim() && isConnected && !isTyping && !isCompleted) {
      sendMessage(message);
      setMessage("");
    }
  };

  const toggleDictation = () => {
    if (dictating) {
      stopDictation();
    } else {
      startDictation();
    }
  };

  const useScriptedOpening = () => {
    setMessage(currentDef.scriptedOpen);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages, isTyping]);

  if (isLoading) {
    return (
      <Box p="xl" ta="center">
        <Loader />
      </Box>
    );
  }

  if (!session) {
    return (
      <Box p="xl">
        <Alert icon={<FaExclamationCircle size={16} />} title="Practice room not found" color="red" mb="md">
          We could not find a practice session for this conversation.
        </Alert>
        <Button leftSection={<FaArrowLeft size={12} />} variant="light" onClick={() => navigate("/system-design/practice")}>
          Back to practice rooms
        </Button>
      </Box>
    );
  }

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
          Trying to reconnect to your practice room...
        </Alert>
      )}

      {isCompleted && (
        <Alert icon={<FaDumbbell size={16} />} title="Drill Completed!" color="green" mb="md">
          You designed {session.case_study.title} end to end. Start a new drill or revisit another case study.
        </Alert>
      )}

      <Group mb="md" justify="space-between" wrap="nowrap">
        <Group wrap="nowrap">
          <Badge size="lg" variant="light" color="teal">
            Design Drill
          </Badge>
          <Text size="lg" fw={700}>
            {session.case_study.title}
          </Text>
          <Badge size="sm" variant="light" color={difficultyColor(session.case_study.difficulty)}>
            {session.case_study.difficulty}
          </Badge>
        </Group>
        <Group wrap="nowrap" style={{ maxWidth: 260 }}>
          <Text size="xs" c="dimmed">
            Phase {currentPhase} of 5
          </Text>
          <Progress value={(currentPhase / 5) * 100} size="sm" color="teal" style={{ flex: 1 }} />
          <Button size="compact-xs" variant="subtle" onClick={() => navigate("/system-design/practice")}>
            All drills
          </Button>
        </Group>
      </Group>

      <Box style={{ flex: 1, minHeight: 0, display: "flex", gap: "1rem", flexDirection: "row" }}>
        {/* Phase rail */}
        <Box
          style={{
            width: 250,
            flexShrink: 0,
            border: "1px solid var(--app-line)",
            borderRadius: "var(--mantine-radius-lg)",
            background: "var(--app-surface)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <Box p="sm" style={{ borderBottom: "1px solid var(--app-line)" }}>
            <Text size="sm" fw={600}>
              Thinking Protocol
            </Text>
          </Box>
          <ScrollArea style={{ flex: 1 }}>
            <Stack gap={0} p={6}>
              {PRACTICE_PHASES.map((phase) => {
                const completed = completedPhases[phase.num];
                const isCurrent = phase.num === currentPhase;
                const locked = phase.num > currentPhase;
                return (
                  <Box
                    key={phase.num}
                    p="sm"
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                      borderRadius: "8px",
                      background: isCurrent ? "var(--mantine-color-teal-0)" : "transparent",
                      opacity: locked && !completed ? 0.45 : 1,
                      border: isCurrent ? "1px solid var(--mantine-color-teal-4)" : "1px solid transparent",
                    }}
                  >
                    <ActionIcon
                      size="sm"
                      radius="xl"
                      mt={1}
                      variant={completed ? "filled" : isCurrent ? "light" : "default"}
                      color={completed ? "green" : isCurrent ? "teal" : "gray"}
                    >
                      {completed ? <FaCheck size={10} /> : locked ? <FaLock size={10} /> : <FaPlay size={10} />}
                    </ActionIcon>
                    <Box style={{ flex: 1, minWidth: 0 }}>
                      <Text size="xs" fw={isCurrent ? 650 : 500}>
                        {phase.num}. {phase.name}
                      </Text>
                      <Text size="xs" c="dimmed" mt={2} lineClamp={2}>
                        {phase.short}
                      </Text>
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          </ScrollArea>
          <Box p="sm" style={{ borderTop: "1px solid var(--app-line)" }}>
            <Text size="xs" c="dimmed" ta="center">
              Phases unlock in order. Finish each one to advance.
            </Text>
          </Box>
        </Box>

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
          }}
        >
          <Box p="sm" style={{ borderBottom: "1px solid var(--app-line)", background: "var(--app-surface-hover)" }}>
            <Text size="sm" fw={600}>
              {currentDef.name}
            </Text>
            <Text size="xs" c="dimmed" mt={2}>
              {currentDef.goal}
            </Text>
          </Box>

          <Box style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "1rem" }}>
            {allMessages.length === 0 && !isTyping ? (
              <Text c="dimmed" ta="center" pt="xl">
                Your interviewer will open with the case study here. Respond with your thinking, phase by phase.
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
                      alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                      maxWidth: "80%",
                    }}
                  >
                    <Box
                      p="sm"
                      style={{
                        backgroundColor: msg.sender === "user" ? "var(--mantine-primary-color-light)" : "var(--app-sunken)",
                        borderRadius: "12px",
                        border: "1px solid var(--app-line)",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                      }}
                    >
                      {msg.content &&
                        (msg.sender === "ai" ? (
                          <Box className="md-content">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </Box>
                        ) : (
                          <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                            {msg.content}
                          </Text>
                        ))}
                      {msg.diagram && <SystemDesignDiagram diagram={msg.diagram} />}
                      {msg.phaseComplete && (
                        <Badge size="sm" variant="light" color="green" mt="xs">
                          Phase complete {msg.phaseSummary ? `— ${msg.phaseSummary}` : ""}
                        </Badge>
                      )}
                    </Box>
                    <Text size="xs" c="dimmed" ta={msg.sender === "user" ? "right" : "left"} style={{ marginTop: 2 }}>
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
            <Stack gap="sm">
              <Group gap="xs">
                <Tooltip
                  label="Copy the suggested opening for this phase into your answer to get unstuck."
                  position="top-start"
                  withArrow
                >
                  <Button size="compact-sm" variant="light" color="teal" leftSection={<FaPlay size={10} />} onClick={useScriptedOpening}>
                    Scripted opening
                  </Button>
                </Tooltip>
                {currentPhase < 4 && (
                  <Badge size="sm" variant="outline" color="gray" leftSection={<FaLock size={9} />}>
                    Whiteboard unlocks at Phase 4
                  </Badge>
                )}
              </Group>
              <Group gap="sm" align="flex-end">
                <Textarea
                  placeholder={`Your answer for ${currentDef.name}...`}
                  value={message}
                  onChange={(e) => setMessage(e.currentTarget.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  style={{ flex: 1 }}
                  disabled={!isConnected || isTyping || isCompleted}
                  autosize
                  minRows={2}
                  maxRows={8}
                />
                <Tooltip
                  label={
                    dictationSupported
                      ? dictating
                        ? "Stop dictation"
                        : "Dictate your answer"
                      : "Speech input is not supported in this browser. Try Chrome or Edge."
                  }
                  withArrow
                >
                  <ActionIcon
                    size="lg"
                    radius="md"
                    variant={dictating ? "filled" : "default"}
                    color={dictating ? "red" : "teal"}
                    aria-label="Dictate your answer"
                    disabled={!dictationSupported || !isConnected || isTyping || isCompleted}
                    onClick={toggleDictation}
                    style={dictating ? { animation: "pulse-red 1.2s ease-in-out infinite" } : undefined}
                  >
                    {dictating ? <RiMicOffLine size={16} /> : <RiMicLine size={16} />}
                  </ActionIcon>
                </Tooltip>
                <Button onClick={handleSendMessage} disabled={!isConnected || !message.trim() || isTyping || isCompleted}>
                  Send
                </Button>
              </Group>
              {dictating && (
                <Group gap="xs" align="center" wrap="nowrap" style={{ padding: "0.25rem 0.5rem", borderRadius: 8, background: "var(--app-surface-hover)" }}>
                  <Box style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--mantine-color-red-6)", flexShrink: 0, animation: "pulse-red 1.2s ease-in-out infinite" }} />
                  <Text size="xs" c="dimmed" style={{ flex: 1 }} lineClamp={1}>
                    {dictationInterim || "Listening…"}
                  </Text>
                  <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
                    Speaking
                  </Text>
                </Group>
              )}
            </Stack>
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
          }}
        >
          {currentPhase >= 4 ? (
            <SystemDesignWhiteboard
              onSubmit={(diagram) => {
                if (isConnected && !isTyping && !isCompleted) {
                  submitDiagram(diagram);
                }
              }}
            />
          ) : (
            <Box
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.75rem",
                color: "var(--mantine-color-dimmed)",
              }}
            >
              <FaLock size={22} />
              <Text size="sm" ta="center" px="md">
                The whiteboard unlocks in Phase 4 (High-Level Design).
                <br />
                Complete Phases 1-3 to draw your architecture.
              </Text>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};
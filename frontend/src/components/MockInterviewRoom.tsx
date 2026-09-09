import { useParams, useNavigate } from "react-router-dom";
import { Box, Text, Button, Stack, Group, Alert, Loader, Textarea, Badge, Anchor, Code, Modal, Collapse, Divider } from "@mantine/core";
import { useState, useMemo, useEffect, useRef } from "react";
import { FaExclamationCircle, FaArrowLeft, FaPlay, FaStopwatch, FaFlagCheckered, FaChevronDown, FaChevronRight } from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import Editor from "@monaco-editor/react";
import { useMantineColorScheme } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useMockInterviewWebSocket } from "../hooks/useMockInterviewWebSocket";
import { getMockInterview, type InterviewEvaluation } from "../api/mockInterview";
import { getConversation } from "../api/conversation";
import { runProblem } from "../api/challenges";
import type { ConversationResponse } from "../types/ai_core/api_types";

const codeKey = (id: string) => `interview-code-${id}`;
const startKey = (id: string) => `interview-start-${id}`;

const VERDICT: Record<string, { label: string; color: string }> = {
  strong_hire: { label: "Strong Hire", color: "teal" },
  hire: { label: "Hire", color: "green" },
  lean_hire: { label: "Lean Hire", color: "yellow" },
  no_hire: { label: "No Hire", color: "red" },
};

const SCORE_LABELS: Record<string, string> = {
  correctness: "Correctness",
  communication: "Communication",
  problem_solving: "Problem solving",
  coding: "Coding",
  speed: "Speed",
};

const Scorecard = ({ evaluation, problemTitle }: { evaluation: InterviewEvaluation; problemTitle: string }) => {
  const v = VERDICT[evaluation.verdict] ?? { label: evaluation.verdict, color: "gray" };
  return (
    <Stack gap="md">
      <Group justify="space-between" wrap="wrap">
        <Box>
          <Text size="xs" c="dimmed" tt="uppercase" fw={700} style={{ letterSpacing: 0.6 }}>Interviewer's verdict</Text>
          <Text size="sm" c="dimmed">{problemTitle}</Text>
        </Box>
        <Badge size="xl" color={v.color} variant="filled">{v.label}</Badge>
      </Group>

      <Group gap="xs">
        <Badge variant="light" color={evaluation.passed === evaluation.total && evaluation.total > 0 ? "teal" : "orange"}>
          {evaluation.passed}/{evaluation.total} tests passed
        </Badge>
      </Group>

      <Stack gap={8}>
        {Object.entries(evaluation.scores).map(([k, val]) => (
          <Group key={k} justify="space-between" wrap="nowrap" gap="sm">
            <Text size="sm" style={{ width: 130, flexShrink: 0 }}>{SCORE_LABELS[k] ?? k}</Text>
            <Group gap={4} style={{ flex: 1 }}>
              {[0, 1, 2, 3].map((i) => (
                <Box key={i} style={{ height: 8, flex: 1, borderRadius: 4,
                  background: i < val ? "var(--mantine-primary-color-filled)" : "var(--app-line)" }} />
              ))}
            </Group>
            <Text size="sm" fw={600} style={{ width: 28, textAlign: "right" }}>{val}/4</Text>
          </Group>
        ))}
      </Stack>

      {evaluation.summary && (
        <Box>
          <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb={4} style={{ letterSpacing: 0.6 }}>Summary</Text>
          <Text size="sm" style={{ lineHeight: 1.6 }}>{evaluation.summary}</Text>
        </Box>
      )}

      <Group align="flex-start" grow>
        {evaluation.strengths.length > 0 && (
          <Box>
            <Text size="xs" c="teal" tt="uppercase" fw={700} mb={4} style={{ letterSpacing: 0.6 }}>Strengths</Text>
            <Stack gap={4}>{evaluation.strengths.map((s, i) => <Text key={i} size="sm">• {s}</Text>)}</Stack>
          </Box>
        )}
        {evaluation.improvements.length > 0 && (
          <Box>
            <Text size="xs" c="orange" tt="uppercase" fw={700} mb={4} style={{ letterSpacing: 0.6 }}>Work on</Text>
            <Stack gap={4}>{evaluation.improvements.map((s, i) => <Text key={i} size="sm">• {s}</Text>)}</Stack>
          </Box>
        )}
      </Group>
    </Stack>
  );
};

export const MockInterviewRoom = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { colorScheme } = useMantineColorScheme();
  const [message, setMessage] = useState("");
  const [code, setCode] = useState("");
  const [output, setOutput] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [showProblem, setShowProblem] = useState(true);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages: liveMessages, isConnected, isTyping, isGrading, evaluation, sendMessage, endInterview } =
    useMockInterviewWebSocket(conversationId!);

  const { data: interview } = useQuery({
    queryKey: ["mock-interview", conversationId],
    queryFn: () => getMockInterview(conversationId!),
    enabled: !!conversationId,
  });

  const { data: conversation } = useQuery<ConversationResponse>({
    queryKey: ["conversation", conversationId, "mock-interview"],
    queryFn: () => getConversation(conversationId!),
    enabled: !!conversationId,
  });

  // Seed the editor from the saved draft or the problem's starter code.
  useEffect(() => {
    if (!conversationId || !interview) return;
    const saved = localStorage.getItem(codeKey(conversationId));
    setCode(saved ?? interview.problem.starter_code ?? "");
  }, [conversationId, interview]);

  // Countdown timer, anchored to first-open time so it survives reloads.
  useEffect(() => {
    if (!conversationId || !interview) return;
    let start = Number(localStorage.getItem(startKey(conversationId)));
    if (!start) {
      start = Date.now();
      localStorage.setItem(startKey(conversationId), String(start));
    }
    const totalMs = interview.duration_minutes * 60 * 1000;
    const tick = () => setRemaining(Math.max(0, start + totalMs - Date.now()));
    tick();
    const h = setInterval(tick, 1000);
    return () => clearInterval(h);
  }, [conversationId, interview]);

  const finalEval = evaluation ?? interview?.evaluation ?? null;

  const allMessages = useMemo(() => {
    const history = conversation?.messages ?? [];
    const ids = new Set(history.map((m) => m.id));
    const merged = [...history, ...liveMessages.filter((m) => !ids.has(m.id))];
    return merged.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [conversation, liveMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages, isTyping, isGrading]);

  const onCodeChange = (v?: string) => {
    const next = v ?? "";
    setCode(next);
    if (conversationId) localStorage.setItem(codeKey(conversationId), next);
  };

  const handleSend = () => {
    if (message.trim() && isConnected && !isTyping && !isGrading) {
      sendMessage(message);
      setMessage("");
    }
  };

  const handleRun = async () => {
    if (!interview) return;
    setIsRunning(true);
    setOutput("");
    try {
      const res = await runProblem(interview.problem.id, code, "python");
      const parts: string[] = [];
      if (res.summary) parts.push(`${res.summary.passed}/${res.summary.total} test cases passed`);
      if (res.error) parts.push(`Error:\n${res.error}`);
      if (res.output && !res.summary) parts.push(res.output);
      setOutput(parts.join("\n") || "(no output)");
    } catch (e) {
      setOutput(e instanceof Error ? e.message : "Failed to run.");
    } finally {
      setIsRunning(false);
    }
  };

  const doEnd = () => {
    setConfirmEnd(false);
    endInterview(code);
  };

  const fmt = (ms: number) => {
    const total = Math.floor(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };
  const timeUp = remaining !== null && remaining <= 0;

  return (
    <Box p="md" style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--app-bg)" }}>
      {!isConnected && !finalEval && (
        <Alert icon={<FaExclamationCircle size={16} />} title="Connection Lost" color="red" mb="md">
          Trying to reconnect to your interviewer...
        </Alert>
      )}

      <Group justify="space-between" mb="md" wrap="nowrap">
        <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
          <Badge size="lg" variant="light" color="violet">Mock Interview</Badge>
          <Text fw={600} truncate>{interview?.problem.title ?? "Loading..."}</Text>
          {interview && <Badge variant="light" color="gray">{interview.problem.difficulty}</Badge>}
        </Group>
        <Group gap="md" wrap="nowrap">
          {remaining !== null && !finalEval && (
            <Badge size="lg" variant="light" color={timeUp ? "red" : remaining < 5 * 60 * 1000 ? "orange" : "gray"}
              leftSection={<FaStopwatch size={11} />}>
              {timeUp ? "Time's up" : fmt(remaining)}
            </Badge>
          )}
          {!finalEval && (
            <Button color="red" variant="light" leftSection={<FaFlagCheckered size={12} />}
              disabled={!isConnected || isGrading} onClick={() => setConfirmEnd(true)}>
              End & get feedback
            </Button>
          )}
          <Anchor component="button" onClick={() => navigate("/mock")} c="dimmed"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <FaArrowLeft size={11} /> Exit
          </Anchor>
        </Group>
      </Group>

      <Box style={{ flex: 1, minHeight: 0, display: "flex", gap: "1rem", flexDirection: "row" }}>
        {/* Interviewer chat */}
        <Box style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", border: "1px solid var(--app-line)", borderRadius: "var(--mantine-radius-lg)", background: "var(--app-surface)", overflow: "hidden" }}>
          <Box style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "1rem" }}>
            {allMessages.length === 0 && !isTyping ? (
              <Text c="dimmed" ta="center" pt="xl">Your interviewer is joining...</Text>
            ) : (
              <Stack gap="sm">
                {allMessages.map((msg) => (
                  <Box key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: msg.sender === "user" ? "flex-end" : "flex-start" }}>
                    <Box p="sm" style={{ backgroundColor: msg.sender === "user" ? "var(--mantine-primary-color-light)" : "var(--app-sunken)", border: "1px solid var(--app-line)", borderRadius: 12, maxWidth: "88%" }}>
                      {msg.sender === "ai" ? (
                        <Box className="md-content"><ReactMarkdown>{msg.content}</ReactMarkdown></Box>
                      ) : (
                        <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>{msg.content}</Text>
                      )}
                    </Box>
                    <Text size="xs" c="dimmed" mt={2}>{new Date(msg.timestamp).toLocaleTimeString()}</Text>
                  </Box>
                ))}
                {isTyping && (
                  <Group gap="xs" style={{ alignSelf: "flex-start" }}>
                    <Box p="sm" style={{ backgroundColor: "var(--app-surface-hover)", borderRadius: 12 }}><Loader size="sm" type="dots" /></Box>
                  </Group>
                )}
                <div ref={messagesEndRef} />
              </Stack>
            )}
          </Box>
          <Box style={{ padding: "0.75rem", flexShrink: 0, borderTop: "1px solid var(--app-line)" }}>
            <Group gap="sm" align="flex-end">
              <Textarea placeholder="Explain your approach, think out loud, or ask a question..." value={message}
                onChange={(e) => setMessage(e.currentTarget.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                style={{ flex: 1 }} disabled={!isConnected || isTyping || isGrading || !!finalEval} autosize minRows={1} maxRows={6} />
              <Button onClick={handleSend} disabled={!isConnected || !message.trim() || isTyping || isGrading || !!finalEval}>Send</Button>
            </Group>
          </Box>
        </Box>

        {/* Problem + editor */}
        <Box style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", border: "1px solid var(--app-line)", borderRadius: "var(--mantine-radius-lg)", background: "var(--app-surface)", overflow: "hidden" }}>
          {interview && (
            <Box style={{ flexShrink: 0, borderBottom: "1px solid var(--app-line)", maxHeight: "38%", overflow: "auto" }}>
              <Group justify="space-between" p="xs" style={{ cursor: "pointer" }} onClick={() => setShowProblem((s) => !s)}>
                <Text size="sm" fw={600}>{showProblem ? <FaChevronDown size={10} /> : <FaChevronRight size={10} />} Problem</Text>
              </Group>
              <Collapse in={showProblem}>
                <Box px="sm" pb="sm">
                  <Box className="md-content" style={{ fontSize: 13 }}><ReactMarkdown>{interview.problem.description}</ReactMarkdown></Box>
                  {interview.problem.examples?.length > 0 && (
                    <>
                      <Divider my="xs" label="Examples" labelPosition="left" />
                      <Stack gap={6}>
                        {interview.problem.examples.map((ex: any, i: number) => (
                          <Code key={i} block style={{ fontSize: 12, whiteSpace: "pre-wrap" }}>
                            {`Input: ${ex.input ?? ""}\nOutput: ${ex.output ?? ""}${ex.explanation ? `\n${ex.explanation}` : ""}`}
                          </Code>
                        ))}
                      </Stack>
                    </>
                  )}
                </Box>
              </Collapse>
            </Box>
          )}
          <Group justify="space-between" p="xs" style={{ borderBottom: "1px solid var(--app-line)", flexShrink: 0 }}>
            <Text size="sm" fw={600}>Your code</Text>
            <Button size="compact-sm" variant="light" color="teal" loading={isRunning} disabled={!interview}
              leftSection={<FaPlay size={10} />} onClick={handleRun}>Run tests</Button>
          </Group>
          <Box style={{ flex: 1, minHeight: 0 }}>
            <Editor height="100%" language="python" theme={colorScheme === "dark" ? "vs-dark" : "vs-light"}
              value={code} onChange={onCodeChange}
              options={{ minimap: { enabled: false }, fontSize: 13, scrollBeyondLastLine: false, readOnly: !!finalEval }} />
          </Box>
          <Box style={{ flexShrink: 0, borderTop: "1px solid var(--app-line)", maxHeight: 150, overflow: "auto", padding: "0.5rem 0.75rem" }}>
            <Text size="xs" fw={600} c="dimmed" mb={4}>Output</Text>
            <Code block style={{ whiteSpace: "pre-wrap", fontSize: 12, background: "transparent" }}>
              {output || "Run your code against the test cases here. The interviewer can't see this — talk them through it in chat."}
            </Code>
          </Box>
        </Box>
      </Box>

      {/* Confirm end */}
      <Modal opened={confirmEnd} onClose={() => setConfirmEnd(false)} title="End the interview?" centered>
        <Text size="sm" c="dimmed" mb="md">
          Your current code will be judged against the hidden test cases and the interviewer will score the whole
          session. You can't continue after this.
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setConfirmEnd(false)}>Keep going</Button>
          <Button color="red" onClick={doEnd}>End & get feedback</Button>
        </Group>
      </Modal>

      {/* Grading overlay */}
      <Modal opened={isGrading} onClose={() => {}} withCloseButton={false} centered>
        <Stack align="center" gap="md" py="lg">
          <Loader />
          <Text fw={600}>Scoring your interview...</Text>
          <Text size="sm" c="dimmed" ta="center">Running your code and reviewing the whole conversation.</Text>
        </Stack>
      </Modal>

      {/* Result */}
      <Modal opened={!!finalEval} onClose={() => {}} withCloseButton={false} centered size="lg">
        {finalEval && interview && (
          <Stack gap="lg">
            <Scorecard evaluation={finalEval} problemTitle={interview.problem.title} />
            <Group justify="flex-end">
              <Button variant="light" onClick={() => navigate(`/challenges/${interview.problem.id}`)}>
                Review the problem
              </Button>
              <Button color="violet" onClick={() => navigate("/mock")}>Done</Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Box>
  );
};

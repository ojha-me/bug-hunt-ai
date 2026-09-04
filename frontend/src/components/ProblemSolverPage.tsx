import { useEffect, useState } from "react";
import {
  Box,
  Text,
  Button,
  Stack,
  Group,
  Badge,
  Card,
  Alert,
  Divider,
  ScrollArea,
  Tabs,
  Code,
  Textarea,
  Skeleton,
  SimpleGrid,
} from "@mantine/core";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import Editor from "@monaco-editor/react";
import { FaArrowLeft, FaPlay, FaPaperPlane, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { RiLightbulbLine } from "react-icons/ri";
import { getProblem, getProblemAttempts, submitProblem, runProblem, getProblemTutorHistory, postProblemTutorChat } from "../api/challenges";
import { useMantineColorScheme } from "@mantine/core";
import type { Difficulty, ProblemAttempt, TutorTurn } from "../types/challenges/api_types";
import type { TestCaseResult } from "../types/execution/api_types";

const difficultyColor = (d: Difficulty) =>
  d === "easy" ? "green" : d === "medium" ? "yellow" : "red";

const verdictColor = (v: string) =>
  v === "passed" ? "green" : v === "timeout" ? "orange" : "red";

const storageKey = (problemId: string) => `problem-code-${problemId}`;

export const ProblemSolverPage = () => {
  const { problemId } = useParams<{ problemId: string }>();
  const navigate = useNavigate();
  const { colorScheme } = useMantineColorScheme();

  const { data: problem, isLoading, isError } = useQuery({
    queryKey: ["coding-problem", problemId],
    queryFn: () => getProblem(problemId!),
    enabled: !!problemId,
  });

  const { data: attempts, refetch: refetchAttempts } = useQuery({
    queryKey: ["problem-attempts", problemId],
    queryFn: () => getProblemAttempts(problemId!),
    enabled: !!problemId,
  });

  const [code, setCode] = useState("");
  const [results, setResults] = useState<TestCaseResult[] | null>(null);
  const [summary, setSummary] = useState<{ passed: number; total: number; all_passed: boolean } | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>("cases");

  const [tutorTurns, setTutorTurns] = useState<TutorTurn[]>([]);
  const [tutorInput, setTutorInput] = useState("");
  const [isTutorThinking, setIsTutorThinking] = useState(false);

  useEffect(() => {
    if (!problem) return;
    getProblemTutorHistory(problem.id)
      .then((history) => setTutorTurns(history))
      .catch(() => setTutorTurns([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problem?.id]);

  useEffect(() => {
    if (!problem) return;
    const saved = localStorage.getItem(storageKey(problem.id)) || "";
    setCode(saved || problem.starter_code);
    setResults(null);
    setSummary(null);
    setExecutionError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problem?.id, problem?.starter_code]);

  const handleRunTests = async () => {
    if (!problem) return;
    setIsRunning(true);
    setExecutionError(null);
    try {
      const response = await runProblem(problem.id, code, "python");
      setResults(response.test_results ?? null);
      setSummary(response.summary ?? null);
      setActiveTab("cases");
    } catch (e) {
      setResults(null);
      setSummary(null);
      setExecutionError(e instanceof Error ? e.message : "Failed to run tests");
      setActiveTab("cases");
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!problem) return;
    setIsSubmitting(true);
    setExecutionError(null);
    try {
      const response = await submitProblem(problem.id, code, "python");
      localStorage.setItem(storageKey(problem.id), code);
      setResults(response.test_results ?? null);
      setSummary(response.summary ?? null);
      setActiveTab("cases");
      refetchAttempts();
    } catch (e) {
      setResults(null);
      setSummary(null);
      setExecutionError(e instanceof Error ? e.message : "Submission failed");
      setActiveTab("cases");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTutorSend = async (text?: string) => {
    if (!problem) return;
    const message = (text ?? tutorInput).trim();
    if (!message || isTutorThinking) return;
    setIsTutorThinking(true);
    setTutorInput("");
    setTutorTurns((prev) => [...prev, { role: "user", content: message }]);
    try {
      const response = await postProblemTutorChat(problem.id, message, code);
      setTutorTurns(response.history?.length ? response.history : [...tutorTurns, { role: "assistant", content: response.reply }]);
    } catch (e) {
      setTutorTurns((prev) => [
        ...prev,
        { role: "assistant", content: `⚠️ Could not reach the tutor: ${e instanceof Error ? e.message : "unknown error"}` },
      ]);
    } finally {
      setIsTutorThinking(false);
    }
  };

  const lastAttempt: ProblemAttempt | undefined = attempts?.[0];

  if (isLoading) {
    return (
      <Box p="lg" style={{ height: "100vh", overflowY: "auto", background: "var(--app-bg)" }}>
        <Group mb="lg" justify="space-between">
          <Group gap="sm">
            <Skeleton height={30} width={90} radius="md" />
            <Skeleton height={30} width={220} radius="md" />
          </Group>
          <Skeleton height={30} width={180} radius="md" />
        </Group>
        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
          <Skeleton height={320} radius="lg" />
          <Skeleton height={320} radius="lg" />
        </SimpleGrid>
      </Box>
    );
  }

  if (isError || !problem) {
    return (
      <Box p="xl">
        <Alert color="red">Problem not found.</Alert>
        <Button mt="md" variant="light" onClick={() => navigate("/challenges")}>
          Back to library
        </Button>
      </Box>
    );
  }

  return (
    <Box p="md" style={{ height: "100vh", overflowY: "auto", background: "var(--app-bg)" }}>
      <Group mb="md" justify="space-between" wrap="wrap">
        <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
          <Button
            variant="subtle"
            color="gray"
            leftSection={<FaArrowLeft size={14} />}
            onClick={() => navigate("/challenges")}
            style={{ flexShrink: 0 }}
          >
            Library
          </Button>
          <Text fw={650} size="lg" lineClamp={1}>
            {problem.title}
          </Text>
          <Badge variant="light" color={difficultyColor(problem.difficulty)}>
            {problem.difficulty}
          </Badge>
        </Group>
        <Group gap="sm">
          <Button variant="light" color="teal" loading={isRunning} onClick={handleRunTests} leftSection={<FaPlay size={12} />}>
            Run Tests
          </Button>
          <Button color="teal" loading={isSubmitting} onClick={handleSubmit} leftSection={<FaPaperPlane size={12} />}>
            Submit
          </Button>
        </Group>
      </Group>

      {lastAttempt && (
        <Alert
          mb="md"
          radius="md"
          color={lastAttempt.verdict === "passed" ? "green" : "red"}
          icon={lastAttempt.verdict === "passed" ? <FaCheckCircle /> : <FaTimesCircle />}
        >
          Last submission: <b>{lastAttempt.verdict}</b> — {lastAttempt.passed_count}/{lastAttempt.total_count} test cases
          {lastAttempt.execution_time_ms ? ` · ${lastAttempt.execution_time_ms}ms` : ""}
        </Alert>
      )}

      <Group align="stretch" style={{ gap: 16 }} wrap="nowrap">
        <Box style={{ width: "42%", minWidth: 320 }}>
          <Card withBorder radius="md" p="md" style={{ height: "calc(100vh - 190px)", overflowY: "auto" }}>
            <Group gap={4} mb="sm" wrap="wrap">
              {problem.topics.map((t) => (
                <Badge key={t} size="xs" variant="filled" color="gray">
                  {t}
                </Badge>
              ))}
            </Group>
            <div style={{ fontSize: 13 }}>
              <ReactMarkdown>{problem.description}</ReactMarkdown>
            </div>

            <Divider my="md" />
            <Text fw={600} size="sm" mb="xs">
              Examples
            </Text>
            {problem.examples.map((ex, i) => (
              <Card key={i} withBorder radius="sm" mb="sm" p="sm">
                <Text size="xs" fw={600} c="dimmed">
                  Example {i + 1}
                </Text>
                <Code block style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>
                  Input:  {ex.input}
                  {"\n"}
                  Output: {ex.output}
                </Code>
                {ex.explanation && (
                  <Text size="xs" c="dimmed" mt="xs">
                    {ex.explanation}
                  </Text>
                )}
              </Card>
            ))}

            <Divider my="md" />
            <Text fw={600} size="sm" mb="xs">
              Constraints
            </Text>
            <Stack gap={4}>
              {problem.constraints.map((c, i) => (
                <Text key={i} size="xs" c="dimmed">
                  • {c}
                </Text>
              ))}
            </Stack>
          </Card>
        </Box>

        <Box style={{ flex: 1, minWidth: 480 }}>
          <Card withBorder radius="md" p={0} style={{ height: "calc(100vh - 190px)", overflow: "hidden" }}>
            <Tabs value={activeTab} onChange={setActiveTab} defaultValue="code">
              <Tabs.List px="sm" pt="sm">
                <Tabs.Tab value="code">Editor</Tabs.Tab>
                <Tabs.Tab value="tests">Tests</Tabs.Tab>
                <Tabs.Tab value="tutor">Tutor</Tabs.Tab>
                <Tabs.Tab value="attempts">Submissions ({attempts?.length ?? 0})</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="code" p={0} className="app-tab-panel">
                <Editor
                  height="calc(100vh - 260px)"
                  language="python"
                  theme={colorScheme === "dark" ? "vs-dark" : "vs-light"}
                  value={code}
                  onChange={(v) => setCode(v ?? "")}
                  options={{ minimap: { enabled: false }, fontSize: 13, scrollBeyondLastLine: false }}
                />
              </Tabs.Panel>

              <Tabs.Panel value="tests" p="md" className="app-tab-panel">
                <ScrollArea style={{ height: "calc(100vh - 300px)" }}>
                  {executionError && (
                    <Alert color="red" mb="md">
                      {executionError}
                    </Alert>
                  )}
                  {summary && (
                    <Group mb="md" justify="space-between">
                      <Text fw={600} size="sm">
                        <b>{summary.passed}</b>/{summary.total} test cases passed
                      </Text>
                      {summary.all_passed ? (
                        <Badge color="green" variant="light">
                          All passed
                        </Badge>
                      ) : (
                        <Badge color="red" variant="light">
                          Some failing
                        </Badge>
                      )}
                    </Group>
                  )}
                  {results?.map((r, i) => (
                    <Card key={i} withBorder radius="sm" mb="sm" p="sm">
                      <Group justify="space-between" mb={4}>
                        <Group gap="sm">
                          <Badge size="xs" color={verdictColor(r.verdict)}>
                            {r.verdict}
                          </Badge>
                          <Text size="sm" fw={600}>
                            {r.name}
                          </Text>
                        </Group>
                        {r.execution_time_ms && (
                          <Text size="xs" c="dimmed">
                            {r.execution_time_ms}ms
                          </Text>
                        )}
                      </Group>
                      {r.error && (
                        <Code block style={{ whiteSpace: "pre-wrap", fontSize: 11, color: "red" }}>
                          {r.error}
                        </Code>
                      )}
                      {r.verdict === "failed" && (
                        <Group align="flex-start" gap="md">
                          <Box style={{ flex: 1 }}>
                            <Text size="xs" fw={600} c="dimmed">
                              Expected
                            </Text>
                            <Code block style={{ whiteSpace: "pre-wrap", fontSize: 11 }}>
                              {r.expected_output}
                            </Code>
                          </Box>
                          <Box style={{ flex: 1 }}>
                            <Text size="xs" fw={600} c="dimmed">
                              Got
                            </Text>
                            <Code block style={{ whiteSpace: "pre-wrap", fontSize: 11 }}>
                              {r.actual_output}
                            </Code>
                          </Box>
                        </Group>
                      )}
                    </Card>
                  ))}
                  {!results && !executionError && (
                    <Text size="sm" c="dimmed" ta="center" pt="lg">
                      Hit <b>Run Tests</b> to check your code against the problem&apos;s test cases, or <b>Submit</b> to submit for evaluation.
                    </Text>
                  )}
                </ScrollArea>
              </Tabs.Panel>

              <Tabs.Panel value="tutor" p={0} className="app-tab-panel" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 270px)" }}>
                <ScrollArea style={{ flex: 1 }} p="md">
                  {tutorTurns.length === 0 && (
                    <Text size="sm" c="dimmed" ta="center" pt="lg">
                      Ask for a hint, or discuss your approach with the AI tutor. Your code is sent along
                      automatically so guidance is specific to you — the tutor will <b>not</b> hand you the
                      full solution.
                    </Text>
                  )}
                  <Stack gap="sm">
                    {tutorTurns.map((turn, i) => (
                      <Box
                        key={i}
                        p="sm"
                        style={{
                          borderRadius: "var(--mantine-radius-md)",
                          maxWidth: "85%",
                          alignSelf: turn.role === "user" ? "flex-end" : "flex-start",
                          background: turn.role === "user" ? "var(--mantine-primary-color-light)" : "var(--app-surface)",
                          border: "1px solid var(--app-line)",
                          boxShadow: "var(--mantine-shadow-xs)",
                        }}
                      >
                        {turn.role === "user" ? (
                          <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                            {turn.content}
                          </Text>
                        ) : (
                          <div style={{ fontSize: 13 }}>
                            <ReactMarkdown>{turn.content}</ReactMarkdown>
                          </div>
                        )}
                      </Box>
                    ))}
                    {isTutorThinking && (
                      <Box p="sm" style={{ alignSelf: "flex-start" }}>
                        <Text size="sm" c="dimmed">
                          Thinking…
                        </Text>
                      </Box>
                    )}
                  </Stack>
                </ScrollArea>
                <Box p="sm" style={{ borderTop: "1px solid var(--app-line)" }}>
                  <Group gap="xs">
                    <Textarea
                      flex={1}
                      size="xs"
                      autosize
                      minRows={1}
                      maxRows={4}
                      placeholder="Ask a question or request a hint…"
                      value={tutorInput}
                      onChange={(e) => setTutorInput(e.currentTarget.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleTutorSend();
                        }
                      }}
                      disabled={isTutorThinking}
                    />
                    <Button
                      size="xs"
                      variant="subtle"
                      leftSection={<RiLightbulbLine size={14} />}
                      onClick={() => handleTutorSend("I'm stuck. Give me a hint — but don't reveal the full solution.")}
                      disabled={isTutorThinking}
                    >
                      Hint
                    </Button>
                    <Button size="xs" leftSection={<FaPaperPlane size={12} />} onClick={() => handleTutorSend()} disabled={isTutorThinking || !tutorInput.trim()}>
                      Send
                    </Button>
                  </Group>
                </Box>
              </Tabs.Panel>

              <Tabs.Panel value="attempts" p="md" className="app-tab-panel">
                <ScrollArea style={{ height: "calc(100vh - 300px)" }}>
                  {attempts?.length ? (
                    attempts.map((a) => (
                      <Card key={a.id} withBorder radius="sm" mb="sm" p="sm">
                        <Group justify="space-between">
                          <Group gap="sm">
                            <Badge size="xs" color={verdictColor(a.verdict)}>
                              {a.verdict}
                            </Badge>
                            <Text size="sm">
                              {a.passed_count}/{a.total_count} passed
                            </Text>
                          </Group>
                          <Text size="xs" c="dimmed">
                            {new Date(a.submitted_at).toLocaleString()}
                            {a.execution_time_ms ? ` · ${a.execution_time_ms}ms` : ""}
                          </Text>
                        </Group>
                      </Card>
                    ))
                  ) : (
                    <Text size="sm" c="dimmed" ta="center" pt="lg">
                      No submissions yet.
                    </Text>
                  )}
                </ScrollArea>
              </Tabs.Panel>
            </Tabs>
          </Card>
        </Box>
      </Group>
    </Box>
  );
};
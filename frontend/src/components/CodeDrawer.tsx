import {
  Drawer,
  Button,
  Box,
  Group,
  Loader,
  ScrollArea,
  Text,
  useMantineTheme,
  TextInput,
  Textarea,
  Badge,
  Tabs,
  ActionIcon,
  Divider,
} from "@mantine/core";
import Editor from "@monaco-editor/react";
import { useState, useEffect } from "react";
import { FaPlus, FaTrash, FaCheck, FaTimes } from "react-icons/fa";
import type {
  TestCaseInput,
  TestCaseResult,
} from "../types/execution/api_types";

interface CodeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  language: string;
  executionOutput: string;
  isExecuting: boolean;
  onRunCode: (code: string, language: string) => void;
  onSubmitCode: (code: string, language: string, message?: string) => void;
  messageId?: string;
  onRunTests?: (code: string, language: string, testCases: TestCaseInput[]) => void;
  testResults?: TestCaseResult[] | null;
  testSummary?: { passed: number; total: number; all_passed: boolean } | null;
  isTesting?: boolean;
}

const emptyCase = (index: number): TestCaseInput => ({
  name: `Case ${index}`,
  stdin: "",
  expected_output: "",
});

const verdictColor = (verdict: string) =>
  verdict === "passed" ? "green" : verdict === "failed" ? "red" : verdict === "timeout" ? "yellow" : "orange";

const verdictLabel = (verdict: string) =>
  verdict === "passed" ? "Passed" : verdict === "failed" ? "Failed" : verdict === "timeout" ? "Timeout" : "Error";

export const CodeDrawer = ({
  isOpen,
  onClose,
  code,
  language,
  executionOutput,
  isExecuting,
  onRunCode,
  onSubmitCode,
  messageId,
  onRunTests,
  testResults,
  testSummary,
  isTesting,
}: CodeDrawerProps) => {
  const theme = useMantineTheme();
  const [currentCode, setCurrentCode] = useState(code);
  const [currentOutput, setCurrentOutput] = useState(executionOutput);
  const [message, setMessage] = useState("");
  const [testCases, setTestCases] = useState<TestCaseInput[]>([emptyCase(1)]);
  const [results, setResults] = useState<TestCaseResult[] | null>(null);

  // Initialize code from session storage or props when drawer opens
  useEffect(() => {
    if (!isOpen) return;
    if (messageId) {
      const storedCodeObject = sessionStorage.getItem("codeStorage");
      if (storedCodeObject) {
        try {
          const codeStorage = JSON.parse(storedCodeObject);
          if (codeStorage[messageId]) {
            setCurrentCode(codeStorage[messageId]);
            return;
          }
        } catch (e) {
          console.error("Error parsing code storage", e);
        }
      }
    }
    setCurrentCode(code);
  }, [isOpen, code, messageId]);

  // Load persisted test cases for this message id when the drawer opens
  useEffect(() => {
    if (!isOpen) return;
    const storageKey = "testCaseStorage";
    const stored = sessionStorage.getItem(storageKey);
    let cases: TestCaseInput[] = [];
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed) cases = parsed[messageId ?? "manual"] ?? [];
      } catch (e) {
        console.error("Error parsing test case storage", e);
      }
    }
    setTestCases(cases.length ? cases : [emptyCase(1)]);
    setResults(null);
  }, [isOpen, messageId]);

  const persistTestCases = (next: TestCaseInput[]) => {
    const storageKey = "testCaseStorage";
    const stored = sessionStorage.getItem(storageKey);
    const all = stored ? JSON.parse(stored) : {};
    all[messageId ?? "manual"] = next;
    sessionStorage.setItem(storageKey, JSON.stringify(all));
    setResults(null);
  };

  const handleTestCaseChange = (index: number, field: keyof TestCaseInput, value: string) => {
    const next = testCases.map((tc, i) => (i === index ? { ...tc, [field]: value } : tc));
    setTestCases(next);
    persistTestCases(next);
  };

  const addTestCase = () => {
    const next = [...testCases, emptyCase(testCases.length + 1)];
    setTestCases(next);
    persistTestCases(next);
  };

  const removeTestCase = (index: number) => {
    const next = testCases.filter((_, i) => i !== index);
    setTestCases(next.length ? next : [emptyCase(1)]);
    persistTestCases(next.length ? next : [emptyCase(1)]);
  };

  const handleRunTests = () => {
    if (!onRunTests) return;
    setResults(null);
    onRunTests(currentCode, language, testCases);
  };

  const handleCodeChange = (value: string) => {
    setCurrentCode(value || "");
    if (!messageId) return;
    try {
      const storedCodeObject = sessionStorage.getItem("codeStorage");
      const codeStorage = storedCodeObject ? JSON.parse(storedCodeObject) : {};
      codeStorage[messageId] = value || "";
      sessionStorage.setItem("codeStorage", JSON.stringify(codeStorage));
    } catch (e) {
      console.error("Error storing code", e);
    }
  };

  const handleReset = () => {
    const storedCodeObject = sessionStorage.getItem("codeStorage");
    if (storedCodeObject) {
      try {
        const codeStorage = JSON.parse(storedCodeObject);
        if (messageId) {
          delete codeStorage[messageId];
          sessionStorage.setItem("codeStorage", JSON.stringify(codeStorage));
        } else {
          sessionStorage.removeItem("codeStorage");
        }
      } catch (e) {
        console.error("Error parsing code storage", e);
        sessionStorage.removeItem("codeStorage");
      }
    }
    setCurrentCode(code);
  };

  useEffect(() => {
    if (isOpen) {
      setCurrentOutput(executionOutput);
    }
  }, [isOpen, executionOutput]);

  useEffect(() => {
    if (testResults) {
      setResults(testResults);
    }
  }, [testResults]);

  return (
    <Drawer
      opened={isOpen}
      onClose={onClose}
      title="Code Editor & Console"
      position="right"
      size="75%"
      styles={{
        body: { height: "calc(100% - 60px)", padding: 0 },
      }}
    >
      <Box
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        <Box style={{ flex: 3, minHeight: 0 }}>
          <Editor
            height="100%"
            language={language}
            value={currentCode}
            onChange={(value) => handleCodeChange(value || "")}
            options={{ fontSize: 14, minimap: { enabled: false } }}
          />
        </Box>

        <Box p="md" style={{ borderTop: `1px solid ${theme.colors.gray[2]}`, borderBottom: `1px solid ${theme.colors.gray[2]}` }}>
          <TextInput
            placeholder="Optional message to send with your code..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            mb="sm"
          />
          <Group>
            <Button
              onClick={() => onRunCode(currentCode, language)}
              loading={isExecuting}
            >
              Run Code
            </Button>
            <Button
              onClick={() => onSubmitCode(currentCode, language, message)}
              loading={isExecuting}
            >
              Submit Code
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
            >
              Reset Code
            </Button>
          </Group>
        </Box>

        <Box style={{ flex: 2, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <Tabs
            defaultValue="console"
            style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}
          >
            <Tabs.List style={{ flexShrink: 0 }}>
              <Tabs.Tab value="console">Console</Tabs.Tab>
              <Tabs.Tab value="tests">Test Cases</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="console" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
              <Box
                style={{
                  flex: 1,
                  minHeight: 0,
                  background: "#1e1e1e",
                  color: "#d4d4d4",
                  fontFamily: "monospace",
                  display: "flex",
                  flexDirection: "column",
                }}
                p="md"
              >
                <Text size="sm" c="dimmed" mb="xs">
                  Console
                </Text>
                <ScrollArea style={{ flex: 1 }}>
                  {isExecuting ? (
                    <Group>
                      <Loader color="white" size="sm" />
                      <Text size="sm">Executing...</Text>
                    </Group>
                  ) : (
                    <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontSize: "14px" }}>
                      {currentOutput || "Output will appear here..."}
                    </pre>
                  )}
                </ScrollArea>
              </Box>
            </Tabs.Panel>

            <Tabs.Panel value="tests" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
              <ScrollArea style={{ flex: 1 }}>
                <Box p="md" style={{ background: "#fafafa" }}>
                  <Group justify="space-between" mb="sm">
                    <Text size="sm" fw={600}>
                      Test cases
                    </Text>
                    <Button size="compact-xs" variant="light" leftSection={<FaPlus size={10} />} onClick={addTestCase}>
                      Add case
                    </Button>
                  </Group>

                  {testCases.map((tc, i) => (
                    <Box
                      key={i}
                      mb="sm"
                      p="sm"
                      style={{
                        border: "1px solid #e9ecef",
                        borderRadius: "8px",
                        background: "#fff",
                      }}
                    >
                      <Group justify="space-between" mb="xs">
                        <TextInput
                          size="xs"
                          style={{ flex: 1 }}
                          placeholder="Case name"
                          value={tc.name ?? ""}
                          onChange={(e) => handleTestCaseChange(i, "name", e.currentTarget.value)}
                        />
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          onClick={() => removeTestCase(i)}
                          disabled={testCases.length === 1}
                        >
                          <FaTrash size={12} />
                        </ActionIcon>
                      </Group>
                      <Group grow align="flex-start">
                        <Textarea
                          size="xs"
                          label="stdin / input"
                          placeholder="line1&#10;line2"
                          minRows={3}
                          autosize
                          value={tc.stdin}
                          onChange={(e) => handleTestCaseChange(i, "stdin", e.currentTarget.value)}
                        />
                        <Textarea
                          size="xs"
                          label="expected output"
                          placeholder="expected stdout"
                          minRows={3}
                          autosize
                          value={tc.expected_output}
                          onChange={(e) => handleTestCaseChange(i, "expected_output", e.currentTarget.value)}
                        />
                      </Group>
                    </Box>
                  ))}

                  <Group mb="md">
                    <Button
                      size="sm"
                      onClick={handleRunTests}
                      loading={isTesting}
                      disabled={!onRunTests || isTesting}
                    >
                      Run Tests
                    </Button>
                    {testSummary && (
                      <Badge
                        size="lg"
                        variant={testSummary.all_passed ? "filled" : "light"}
                        color={testSummary.all_passed ? "green" : testSummary.passed > 0 ? "orange" : "red"}
                      >
                        {testSummary.passed}/{testSummary.total} passed
                      </Badge>
                    )}
                  </Group>

                  {results && (
                    <Box>
                      <Divider mb="sm" />
                      {results.map((r, i) => (
                        <Box
                          key={i}
                          mb="sm"
                          p="sm"
                          style={{
                            border: `1px solid ${r.verdict === "passed" ? "#d3f9d8" : "#ffe3e3"}`,
                            borderRadius: "8px",
                            background: r.verdict === "passed" ? "#f6ffed" : "#fff5f5",
                          }}
                        >
                          <Group mb="xs">
                            <Text size="sm" fw={600}>
                              {r.name}
                            </Text>
                            <Badge size="sm" variant="light" color={verdictColor(r.verdict)}>
                              {verdictLabel(r.verdict)}
                            </Badge>
                            {r.execution_time_ms != null && (
                              <Text size="xs" c="dimmed">
                                {r.execution_time_ms}ms
                              </Text>
                            )}
                            {r.verdict === "passed" ? (
                              <FaCheck size={12} color="#2f9e44" />
                            ) : (
                              <FaTimes size={12} color="#e03131" />
                            )}
                          </Group>
                          {r.verdict === "error" && r.error && (
                            <pre style={{ whiteSpace: "pre-wrap", background: "#1e1e1e", color: "#ffa8a8", padding: 8, borderRadius: 6, fontSize: 12 }}>
                              {r.error}
                            </pre>
                          )}
                          {r.verdict === "failed" && (
                            <Box>
                              <Text size="xs" c="dimmed">
                                expected:
                              </Text>
                              <pre style={{ whiteSpace: "pre-wrap", margin: "2px 0 6px", fontSize: 12 }}>{r.expected_output || "(empty)"}</pre>
                              <Text size="xs" c="dimmed">
                                got:
                              </Text>
                              <pre style={{ whiteSpace: "pre-wrap", margin: "2px 0 0", fontSize: 12 }}>{r.actual_output || "(empty)"}</pre>
                            </Box>
                          )}
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              </ScrollArea>
            </Tabs.Panel>
          </Tabs>
        </Box>
      </Box>
    </Drawer>
  );
};
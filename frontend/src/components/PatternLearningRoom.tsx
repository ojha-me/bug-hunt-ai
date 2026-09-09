import { useParams, useNavigate } from "react-router-dom";
import { Box, Text, Button, Stack, Group, Alert, Loader, Textarea, Badge, Anchor, Code } from "@mantine/core";
import { useState, useMemo, useEffect, useRef } from "react";
import { FaExclamationCircle, FaArrowLeft, FaPlay, FaPaperPlane, FaRedo, FaArrowRight, FaPen, FaTrash } from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import Editor from "@monaco-editor/react";
import { useMantineColorScheme } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useComponentTutorWebSocket } from "../hooks/useComponentTutorWebSocket";
import { getConversation } from "../api/conversation";
import { runCode } from "../api/execution";
import type { ConversationResponse } from "../types/ai_core/api_types";

const STARTER = "# Write your solution here. Run it to test, then send it to the tutor.\n\n";
const codeKey = (id: string) => `pattern-learn-code-${id}`;

// Pull fenced code blocks out of an AI message so we can load them into the editor.
const extractCodeBlocks = (content: string): string[] => {
  const blocks: string[] = [];
  const re = /```(?:[a-zA-Z0-9]*)\n([\s\S]*?)```/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    const code = m[1].replace(/\n$/, "");
    if (code.trim()) blocks.push(code);
  }
  return blocks;
};

export const PatternLearningRoom = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { colorScheme } = useMantineColorScheme();
  const [message, setMessage] = useState("");
  const [code, setCode] = useState(STARTER);
  const [output, setOutput] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages: liveMessages, deletedIds, sendMessage, regenerate, deleteMessage, isConnected, isTyping } =
    useComponentTutorWebSocket(conversationId!);

  const { data: conversation } = useQuery<ConversationResponse>({
    queryKey: ["conversation", conversationId, "pattern-learn"],
    queryFn: () => getConversation(conversationId!),
    enabled: !!conversationId,
  });

  useEffect(() => {
    if (!conversationId) return;
    setCode(localStorage.getItem(codeKey(conversationId)) || STARTER);
  }, [conversationId]);

  const allMessages = useMemo(() => {
    const history = conversation?.messages ?? [];
    const ids = new Set(history.map((m) => m.id));
    const merged = [...history, ...liveMessages.filter((m) => !ids.has(m.id))].filter((m) => !deletedIds.has(m.id));
    return merged.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [conversation, liveMessages, deletedIds]);

  const lastMsg = allMessages[allMessages.length - 1];
  const danglingUserMsg = !!lastMsg && lastMsg.sender === "user" && !isTyping;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages, isTyping]);

  const onCodeChange = (v?: string) => {
    const next = v ?? "";
    setCode(next);
    if (conversationId) localStorage.setItem(codeKey(conversationId), next);
  };

  const handleSend = () => {
    if (message.trim() && isConnected) {
      sendMessage({ message });
      setMessage("");
    }
  };

  const handleRun = async () => {
    setIsRunning(true);
    setOutput("");
    try {
      const res = await runCode({ code, language: "python" });
      setOutput(res.output ? res.output : res.error ? `Error:\n${res.error}` : "(no output)");
    } catch (e) {
      setOutput(e instanceof Error ? e.message : "Failed to run.");
    } finally {
      setIsRunning(false);
    }
  };

  const sendCodeToTutor = () => {
    if (!isConnected || isTyping) return;
    const body = "Here's my solution — please review it:\n\n```python\n" + code.trim() + "\n```";
    sendMessage({ message: body });
  };

  const canMutate = isConnected && !isTyping;

  const handleDelete = (id: string) => {
    if (!canMutate) return;
    deleteMessage(id, false);
  };

  // Regenerate an AI reply: drop it, then ask the tutor to answer the prior turn again.
  const handleRetry = (id: string) => {
    if (!canMutate) return;
    deleteMessage(id, false);
    regenerate();
  };

  const startEdit = (id: string, content: string) => {
    setEditingId(id);
    setEditValue(content);
  };

  // Save an edited user turn: remove it and everything after, then resend the new text.
  const saveEdit = () => {
    if (!canMutate || !editingId || !editValue.trim()) return;
    deleteMessage(editingId, true);
    sendMessage({ message: editValue.trim() });
    setEditingId(null);
    setEditValue("");
  };

  return (
    <Box p="md" style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--app-bg)" }}>
      {!isConnected && (
        <Alert icon={<FaExclamationCircle size={16} />} title="Connection Lost" color="red" mb="md">
          Trying to reconnect to the tutor...
        </Alert>
      )}

      <Group justify="space-between" mb="md" wrap="nowrap">
        <Group gap="sm" wrap="nowrap">
          <Badge size="lg" variant="light" color="teal">Pattern Lesson</Badge>
          <Text fw={600} truncate>{conversation?.title ?? "Learn with the tutor"}</Text>
        </Group>
        <Anchor component="button" onClick={() => navigate("/patterns")} c="dimmed"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}>
          <FaArrowLeft size={11} /> Patterns
        </Anchor>
      </Group>

      <Box style={{ flex: 1, minHeight: 0, display: "flex", gap: "1rem", flexDirection: "row" }}>
        {/* Tutor chat */}
        <Box style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", border: "1px solid var(--app-line)", borderRadius: "var(--mantine-radius-lg)", background: "var(--app-surface)", overflow: "hidden" }}>
          <Box style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "1rem" }}>
            {allMessages.length === 0 && !isTyping ? (
              <Text c="dimmed" ta="center" pt="xl">Your tutor is warming up...</Text>
            ) : (
              <Stack gap="sm">
                {allMessages.map((msg, i) => {
                  const isLast = i === allMessages.length - 1;
                  const prev = allMessages[i - 1];
                  const canRetry = msg.sender === "ai" && isLast && !!prev && prev.sender === "user";

                  if (editingId === msg.id) {
                    return (
                      <Box key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                        <Box style={{ width: "85%" }}>
                          <Textarea value={editValue} onChange={(e) => setEditValue(e.currentTarget.value)} autosize minRows={2} maxRows={8}
                            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveEdit(); } }} autoFocus />
                          <Group gap="xs" justify="flex-end" mt={6}>
                            <Button size="compact-xs" variant="subtle" color="gray" onClick={() => setEditingId(null)}>Cancel</Button>
                            <Button size="compact-xs" color="violet" disabled={!canMutate || !editValue.trim()} onClick={saveEdit}>Save & resend</Button>
                          </Group>
                        </Box>
                      </Box>
                    );
                  }

                  return (
                    <Box key={msg.id} className="msg-row" style={{ display: "flex", flexDirection: "column", alignItems: msg.sender === "user" ? "flex-end" : "flex-start" }}>
                      <Box p="sm" style={{ backgroundColor: msg.sender === "user" ? "var(--mantine-primary-color-light)" : "var(--app-sunken)", border: "1px solid var(--app-line)", borderRadius: 12, maxWidth: "85%" }}>
                        {msg.sender === "ai" ? (
                          <>
                            <Box className="md-content"><ReactMarkdown>{msg.content}</ReactMarkdown></Box>
                            {extractCodeBlocks(msg.content).map((block, bi, arr) => (
                              <Button
                                key={bi}
                                size="compact-xs"
                                variant="light"
                                color="teal"
                                mt={6}
                                mr={6}
                                leftSection={<FaArrowRight size={10} />}
                                onClick={() => onCodeChange(block)}
                              >
                                {arr.length > 1 ? `Load snippet ${bi + 1}` : "Load into editor"}
                              </Button>
                            ))}
                          </>
                        ) : (
                          <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>{msg.content}</Text>
                        )}
                      </Box>
                      <Group gap={4} mt={2} align="center">
                        <Text size="xs" c="dimmed">{new Date(msg.timestamp).toLocaleTimeString()}</Text>
                        <Group gap={2} className="msg-actions">
                          {msg.sender === "user" && (
                            <Button size="compact-xs" variant="subtle" color="gray" px={6} disabled={!canMutate}
                              leftSection={<FaPen size={9} />} onClick={() => startEdit(msg.id, msg.content)}>Edit</Button>
                          )}
                          {canRetry && (
                            <Button size="compact-xs" variant="subtle" color="gray" px={6} disabled={!canMutate}
                              leftSection={<FaRedo size={9} />} onClick={() => handleRetry(msg.id)}>Retry</Button>
                          )}
                          <Button size="compact-xs" variant="subtle" color="gray" px={6} disabled={!canMutate}
                            leftSection={<FaTrash size={9} />} onClick={() => handleDelete(msg.id)}>Delete</Button>
                        </Group>
                      </Group>
                    </Box>
                  );
                })}
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
            <Stack gap="sm">
              {danglingUserMsg && (
                <Group gap="xs" p="xs" justify="space-between" wrap="nowrap" style={{ borderRadius: 8, background: "var(--mantine-color-orange-light)" }}>
                  <Text size="xs" c="dimmed" lineClamp={1}>No response yet — the connection may have dropped.</Text>
                  <Button size="compact-xs" variant="light" color="orange" leftSection={<FaRedo size={10} />} disabled={!isConnected} onClick={regenerate}>
                    Get response
                  </Button>
                </Group>
              )}
              <Group gap="sm" align="flex-end">
                <Textarea placeholder="Ask the tutor, or answer their question..." value={message}
                  onChange={(e) => setMessage(e.currentTarget.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  style={{ flex: 1 }} disabled={!isConnected || isTyping} autosize minRows={1} maxRows={6} />
                <Button onClick={handleSend} disabled={!isConnected || !message.trim() || isTyping}>Send</Button>
              </Group>
            </Stack>
          </Box>
        </Box>

        {/* Code editor */}
        <Box style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", border: "1px solid var(--app-line)", borderRadius: "var(--mantine-radius-lg)", background: "var(--app-surface)", overflow: "hidden" }}>
          <Group justify="space-between" p="xs" style={{ borderBottom: "1px solid var(--app-line)", flexShrink: 0 }}>
            <Text size="sm" fw={600}>Your code</Text>
            <Group gap="xs">
              <Button size="compact-sm" variant="light" color="teal" loading={isRunning} leftSection={<FaPlay size={10} />} onClick={handleRun}>
                Run
              </Button>
              <Button size="compact-sm" color="violet" leftSection={<FaPaperPlane size={10} />} disabled={!isConnected || isTyping} onClick={sendCodeToTutor}>
                Send to tutor
              </Button>
            </Group>
          </Group>
          <Box style={{ flex: 1, minHeight: 0 }}>
            <Editor height="100%" language="python" theme={colorScheme === "dark" ? "vs-dark" : "vs-light"}
              value={code} onChange={onCodeChange}
              options={{ minimap: { enabled: false }, fontSize: 13, scrollBeyondLastLine: false }} />
          </Box>
          <Box style={{ flexShrink: 0, borderTop: "1px solid var(--app-line)", maxHeight: 180, overflow: "auto", padding: "0.5rem 0.75rem" }}>
            <Text size="xs" fw={600} c="dimmed" mb={4}>Output</Text>
            <Code block style={{ whiteSpace: "pre-wrap", fontSize: 12, background: "transparent" }}>
              {output || "Run your code to see output here."}
            </Code>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

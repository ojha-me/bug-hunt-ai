import { useParams, useNavigate } from "react-router-dom";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaExclamationCircle, FaLock, FaCheck, FaPlay, FaGraduationCap } from "react-icons/fa";
import { RiFocus3Line, RiArrowRightLine, RiMicLine, RiMicOffLine } from "react-icons/ri";
import { useSDLearningWebSocket } from "../hooks/useSDLearningWebSocket";
import { useSpeechToText } from "../hooks/useSpeechToText";
import {
  getUserSDCourses,
  getSDCourseDetail,
  enrollInSDCourse,
} from "../api/systemDesign";
import type { SDLessonResponse, UserSDCourseResponse } from "../types/system_design/api_types";
import type { ReactFlowDiagram } from "../types/ai_core/api_types";
import { SystemDesignWhiteboard } from "./SystemDesignWhiteboard";
import { SystemDesignDiagram } from "./SystemDesignDiagram";

export const SDLearningRoom = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [lessonId, setLessonId] = useState<string | null>(null);
  const [loadedDiagram, setLoadedDiagram] = useState<ReactFlowDiagram | null>(null);
  const [message, setMessage] = useState("");
  const [courseCompleted, setCourseCompleted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { supported: dictationSupported, listening: dictating, interim: dictationInterim, start: startDictation, stop: stopDictation } =
    useSpeechToText((segment) => {
      if (segment) setMessage((prev) => (prev ? `${prev.trimEnd()} ${segment}` : segment));
    });

  const { data: userCourses, isLoading: userCoursesLoading } = useQuery({
    queryKey: ["sd-user-courses"],
    queryFn: getUserSDCourses,
  });
  const userCourse = userCourses?.find((uc) => uc.course.id === courseId);

  const { data: course } = useQuery({
    queryKey: ["sd-course-detail", courseId],
    queryFn: () => getSDCourseDetail(courseId!),
    enabled: !!courseId,
  });

  const enrollMutation = useMutation({
    mutationFn: enrollInSDCourse,
    onSuccess: (enrolled) => {
      queryClient.setQueryData<UserSDCourseResponse[]>(["sd-user-courses"], (old) =>
        old?.some((u) => u.id === enrolled.id)
          ? old.map((u) => (u.id === enrolled.id ? enrolled : u))
          : [...(old ?? []), enrolled]
      );
    },
  });

  useEffect(() => {
    if (!userCoursesLoading && courseId && !userCourse) {
      enrollMutation.mutate(courseId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userCoursesLoading, courseId, !!userCourse]);

  useEffect(() => {
    if (!lessonId && userCourse?.current_lesson?.id) {
      setLessonId(userCourse.current_lesson.id);
      const ref = userCourse.current_lesson.reference_diagram ?? null;
      if (ref) setLoadedDiagram(ref);
    }
  }, [userCourse, lessonId]);

  const {
    messages: liveMessages,
    sendMessage,
    submitDiagram,
    nextLesson,
    isConnected,
    isTyping,
    isReady,
    progress,
  } = useSDLearningWebSocket(courseId, lessonId, {
    onLessonChange: (newLessonId, refDiagram) => {
      setLessonId(newLessonId);
      setLoadedDiagram(refDiagram ?? null);
      queryClient.invalidateQueries({ queryKey: ["sd-user-courses"] });
    },
    onCourseCompleted: () => {
      setCourseCompleted(true);
      queryClient.invalidateQueries({ queryKey: ["sd-user-courses"] });
    },
  });

  const selectLesson = useCallback((lesson: SDLessonResponse) => {
    setLessonId(lesson.id);
    setLoadedDiagram(lesson.reference_diagram ?? null);
  }, []);

  const progressByLesson = useMemo(() => {
    const map: Record<string, string> = {};
    userCourse?.progress.forEach((p) => {
      map[p.lesson.id] = p.status;
    });
    return map;
  }, [userCourse]);

  const currentLessonName = useMemo(() => {
    const current = lessonId ? course?.lessons.find((l) => l.id === lessonId) : null;
    return current?.name ?? userCourse?.current_lesson?.name ?? "";
  }, [lessonId, course, userCourse]);

  const isLessonClickable = (lesson: SDLessonResponse) => {
    const status = progressByLesson[lesson.id];
    return status === "completed" || lesson.id === lessonId;
  };

  const handleSendMessage = () => {
    if (message.trim() && isConnected && !isTyping) {
      sendMessage({ message });
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [liveMessages, isTyping]);

  if (userCoursesLoading) {
    return (
      <Box p="xl" ta="center">
        <Loader />
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
      {!isConnected && lessonId && (
        <Alert icon={<FaExclamationCircle size={16} />} title="Connection Lost" color="red" mb="md">
          Trying to reconnect to the lesson...
        </Alert>
      )}

      {courseCompleted && (
        <Alert icon={<FaGraduationCap size={16} />} title="Course Completed!" color="green" mb="md">
          You finished the entire {course?.name} course. Head back to the catalog to start another one.
        </Alert>
      )}

      <Group mb="md" justify="space-between" wrap="nowrap">
        <Group wrap="nowrap">
          <Badge size="lg" variant="light" color="violet">
            System Design
          </Badge>
          <Text size="lg" fw={700}>
            {course?.name}
          </Text>
          <Text size="sm" c="dimmed">
            {currentLessonName || "—"}
          </Text>
        </Group>
        <Group wrap="nowrap" style={{ maxWidth: 260 }}>
          {userCourse && (
            <>
              <Text size="xs" c="dimmed">
                {Math.round(userCourse.progress_percentage)}%
              </Text>
              <Progress
                value={userCourse.progress_percentage}
                size="sm"
                color={userCourse.is_completed ? "green" : "violet"}
                style={{ flex: 1 }}
              />
            </>
          )}
          <Button size="compact-xs" variant="subtle" onClick={() => navigate("/system-design/courses")}>
            All courses
          </Button>
        </Group>
      </Group>

      <Box style={{ flex: 1, minHeight: 0, display: "flex", gap: "1rem", flexDirection: "row" }}>
        {/* Lesson rail */}
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
              Curriculum
            </Text>
          </Box>
          <ScrollArea style={{ flex: 1 }}>
            <Stack gap={0} p={6}>
              {course?.lessons.map((lesson) => {
                const status = progressByLesson[lesson.id] ?? "not_started";
                const clickable = isLessonClickable(lesson);
                const isCurrent = lesson.id === lessonId;
                const completed = status === "completed";
                const locked = !clickable && !isCurrent;
                return (
                  <Box
                    key={lesson.id}
                    onClick={() => (isCurrent ? undefined : clickable ? selectLesson(lesson) : undefined)}
                    p="sm"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      borderRadius: "8px",
                      cursor: isCurrent ? "default" : clickable ? "pointer" : "not-allowed",
                      background: isCurrent ? "var(--mantine-color-violet-1)" : "transparent",
                      opacity: locked ? 0.5 : 1,
                      border: isCurrent ? "1px solid var(--mantine-color-violet-4)" : "1px solid transparent",
                    }}
                  >
                    <ActionIcon
                      size="sm"
                      radius="xl"
                      variant={completed ? "filled" : isCurrent ? "light" : "default"}
                      color={completed ? "green" : isCurrent ? "violet" : "gray"}
                    >
                      {completed ? <FaCheck size={10} /> : locked ? <FaLock size={10} /> : <FaPlay size={10} />}
                    </ActionIcon>
                    <Text size="xs" fw={isCurrent ? 600 : 450} lineClamp={2}>
                      {lesson.name}
                    </Text>
                  </Box>
                );
              })}
            </Stack>
          </ScrollArea>
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
          <Box style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "1rem" }}>
            {liveMessages.length === 0 && !isTyping ? (
              <Text c="dimmed" ta="center" pt="xl">
                Your tutor will greet you here shortly. Chat, and use the whiteboard when you want to draw an architecture.
              </Text>
            ) : (
              <Stack gap="sm">
                {liveMessages.map((msg) => (
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
                        backgroundColor: msg.sender === "user" ? "var(--mantine-primary-color-light)" : "var(--app-sunken)",
                        borderRadius: "12px",
                        border: "1px solid var(--app-line)",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                        maxWidth: "70%",
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
                      {msg.diagram && (
                        <>
                          <SystemDesignDiagram diagram={msg.diagram} />
                          <Button
                            variant="subtle"
                            size="compact-xs"
                            color="violet"
                            mt={4}
                            leftSection={<RiFocus3Line size={14} />}
                            onClick={() => setLoadedDiagram(msg.diagram!)}
                          >
                            Load to whiteboard
                          </Button>
                        </>
                      )}
                    </Box>
                    <Text size="xs" c="dimmed" ta={msg.sender === "user" ? "right" : "left"} style={{ marginTop: "2px" }}>
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

          {progress && (progress.covered_points.length > 0 || progress.remaining_points.length > 0) && (
            <Box p="sm" style={{ borderTop: "1px solid var(--app-line)", background: "var(--app-surface-hover)" }}>
              <Group gap="6px" wrap="wrap">
                {progress.covered_points.map((p) => (
                  <Badge key={p} size="xs" color="green" variant="light">
                    {p}
                  </Badge>
                ))}
                {progress.remaining_points.map((p) => (
                  <Badge key={p} size="xs" color="gray" variant="light">
                    {p}
                  </Badge>
                ))}
                <Badge size="xs" color={isReady ? "green" : "violet"} variant="outline">
                  confidence {Math.round((progress.ai_confidence ?? 0) * 100)}%
                </Badge>
              </Group>
            </Box>
          )}

          <Divider />
          <Box style={{ padding: "0.75rem", flexShrink: 0, background: "var(--app-surface)", borderTop: "1px solid var(--app-line)" }}>
            <Stack gap="sm">
              {isReady && !courseCompleted && (
                <Button
                  fullWidth
                  variant="filled"
                  color="violet"
                  rightSection={<RiArrowRightLine size={16} />}
                  onClick={() => {
                    setCourseCompleted(false);
                    nextLesson();
                  }}
                >
                  Next Lesson
                </Button>
              )}
              <Group gap="sm" align="flex-end">
                <Textarea
                  placeholder={`Ask your tutor about ${currentLessonName || "this lesson"}...`}
                  value={message}
                  onChange={(e) => setMessage(e.currentTarget.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  style={{ flex: 1 }}
                  disabled={!isConnected || isTyping || courseCompleted}
                  autosize
                  minRows={2}
                  maxRows={8}
                />
                <Tooltip
                  label={
                    dictationSupported
                      ? dictating
                        ? "Stop dictation"
                        : "Dictate your question"
                      : "Speech input is not supported in this browser. Try Chrome or Edge."
                  }
                  withArrow
                >
                  <ActionIcon
                    size="lg"
                    radius="md"
                    variant={dictating ? "filled" : "default"}
                    color={dictating ? "red" : "violet"}
                    aria-label="Dictate your message"
                    disabled={!dictationSupported || !isConnected || isTyping || courseCompleted}
                    onClick={toggleDictation}
                    style={dictating ? { animation: "pulse-red 1.2s ease-in-out infinite" } : undefined}
                  >
                    {dictating ? <RiMicOffLine size={16} /> : <RiMicLine size={16} />}
                  </ActionIcon>
                </Tooltip>
                <Button
                  onClick={handleSendMessage}
                  disabled={!isConnected || !message.trim() || isTyping || courseCompleted}
                >
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
          <SystemDesignWhiteboard
            loadedDiagram={loadedDiagram}
            onSubmit={(diagram) => {
              if (isConnected && !isTyping && !courseCompleted) {
                submitDiagram(diagram);
              }
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};
import { useMemo } from "react";
import {
  Box,
  Text,
  Button,
  Stack,
  Group,
  Badge,
  Card,
  Loader,
  SimpleGrid,
  Progress,
  Title,
} from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  FaPlus,
  FaGraduationCap,
  FaCode,
  FaProjectDiagram,
  FaBook,
  FaCheckCircle,
  FaTimesCircle,
  FaPlay,
  FaBolt,
  FaRedoAlt,
} from "react-icons/fa";
import { getMyProblemProgress } from "../api/challenges";
import { getUserSDCourses } from "../api/systemDesign";
import { userLearningPaths } from "../api/learningPaths";
import { getConversations } from "../api/conversation";
import { getDueRevisionItems } from "../api/revision";
import type { ConversationTypeChoices } from "../types/ai_core/api_types";
import type { UserLearningPathResponse } from "../types/learning_paths/api_types";

const conversationHref = (id: string, type?: ConversationTypeChoices | null) =>
  type === "system_design" || type === "system_design_learning"
    ? `/system-design/${id}`
    : `/conversation/${id}`;

export const DashboardPage = () => {
  const navigate = useNavigate();

  const { data: myProgress, isLoading: progressLoading } = useQuery({
    queryKey: ["my-progress"],
    queryFn: getMyProblemProgress,
  });
  const { data: sdCourses, isLoading: sdLoading } = useQuery({
    queryKey: ["sd-user-courses"],
    queryFn: getUserSDCourses,
  });
  const { data: paths, isLoading: pathsLoading } = useQuery<UserLearningPathResponse[]>({
    queryKey: ["learning-paths"],
    queryFn: () => userLearningPaths(),
  });
  const { data: conversations, isLoading: convosLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: getConversations,
  });

  const { data: dueItems } = useQuery({
    queryKey: ["revision-due"],
    queryFn: getDueRevisionItems,
  });

  const stats = useMemo(() => {
    const solved = (myProgress ?? []).filter((p) => p.solved).length;
    const attempted = (myProgress ?? []).filter((p) => p.attempts > 0);
    const totalAttempts = attempted.reduce((s, p) => s + p.attempts, 0);
    const passed = attempted.reduce((s, p) => s + p.best_passed, 0);
    const attemptedTotal = attempted.reduce((s, p) => s + p.best_total, 0);
    const passRate = attemptedTotal > 0 ? Math.round((passed / attemptedTotal) * 100) : null;

    const sd = sdCourses ?? [];
    const enrolled = sd.filter((c) => c.is_active).length;
    const lessonsCompleted = sd.reduce(
      (s, c) =>
        s + c.progress.filter((p) => p.status === "completed").length,
      0
    );

    const activePaths = (paths ?? []).filter((p) => !p.is_completed).length;

    return { solved, totalAttempts, passRate, enrolled, lessonsCompleted, activePaths };
  }, [myProgress, sdCourses, paths]);

  const focus = useMemo(() => {
    const weak = (myProgress ?? []).filter((p) => p.attempts > 0 && !p.solved);
    const topicCount = new Map<string, number>();
    weak.forEach((p) => p.topics.forEach((t) => topicCount.set(t, (topicCount.get(t) ?? 0) + 1)));
    const topics = Array.from(topicCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name]) => name);
    return { weak, topics };
  }, [myProgress]);

  const recentConversations = useMemo(
    () =>
      [...(conversations ?? [])]
        .sort((a, b) => new Date(b.last_active_at).getTime() - new Date(a.last_active_at).getTime())
        .slice(0, 5),
    [conversations]
  );

  const inProgressSd = useMemo(
    () => (sdCourses ?? []).filter((c) => c.is_active && !c.is_completed),
    [sdCourses]
  );

  const activePaths = useMemo(
    () => (paths ?? []).filter((p) => !p.is_completed),
    [paths]
  );

  const loading = progressLoading || sdLoading || pathsLoading || convosLoading;

  return (
    <Box
      p="md"
      style={{ height: "100vh", overflowY: "auto", background: "#f9f9f9" }}
    >
      <Group mb="lg" justify="space-between" wrap="wrap">
        <Box>
          <Title order={3}>Dashboard</Title>
          <Text size="sm" c="dimmed">
            Pick up where you left off, or start something new.
          </Text>
        </Box>
        <Group gap="sm">
          <Button variant="outline" leftSection={<FaPlus size={12} />} onClick={() => navigate("/topics")}>
            New Learning Path
          </Button>
          <Button color="violet" leftSection={<FaProjectDiagram size={12} />} onClick={() => navigate("/system-design/courses")}>
            System Design
          </Button>
          <Button color="teal" leftSection={<FaCode size={12} />} onClick={() => navigate("/challenges")}>
            Coding Problems
          </Button>
        </Group>
      </Group>

      {loading ? (
        <Box p="xl" ta="center">
          <Loader />
        </Box>
      ) : (
        <>
          <SimpleGrid cols={{ base: 2, sm: 3, lg: 5 }} spacing="md" mb="lg">
            <Card withBorder radius="md" p="md" bg="green.0">
              <Group gap="xs">
                <FaCheckCircle color="green" />
                <Text size="sm" c="dimmed">
                  Problems Solved
                </Text>
              </Group>
              <Text size="xl" fw={700}>
                {stats.solved}
                <Text component="span" size="sm" c="dimmed" fw={400}>
                  {" "}/ {(myProgress ?? []).length}
                </Text>
              </Text>
            </Card>
            <Card withBorder radius="md" p="md">
              <Group gap="xs">
                <FaCode color="teal" />
                <Text size="sm" c="dimmed">
                  Attempts
                </Text>
              </Group>
              <Text size="xl" fw={700}>
                {stats.totalAttempts}
              </Text>
            </Card>
            <Card withBorder radius="md" p="md">
              <Group gap="xs">
                <FaBolt color="orange" />
                <Text size="sm" c="dimmed">
                  Pass Rate
                </Text>
              </Group>
              <Text size="xl" fw={700}>
                {stats.passRate === null ? "—" : `${stats.passRate}%`}
              </Text>
            </Card>
            <Card withBorder radius="md" p="md">
              <Group gap="xs">
                <FaProjectDiagram color="violet" />
                <Text size="sm" c="dimmed">
                  SD Lessons Done
                </Text>
              </Group>
              <Text size="xl" fw={700}>
                {stats.lessonsCompleted}
              </Text>
            </Card>
            <Card withBorder radius="md" p="md" bg="blue.0">
              <Group gap="xs">
                <FaGraduationCap color="blue" />
                <Text size="sm" c="dimmed">
                  Active Paths
                </Text>
              </Group>
              <Text size="xl" fw={700}>
                {stats.activePaths}
              </Text>
            </Card>
          </SimpleGrid>

          <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
            <Stack gap="lg">
              <Card withBorder radius="md" p="lg">
                <Text fw={600} size="sm" mb="xs">
                  Resume
                </Text>

                {activePaths.length > 0 && (
                  <>
                    <Text size="xs" c="dimmed" fw={600} mb={4}>
                      Learning paths
                    </Text>
                    <Stack gap={4} mb="md">
                      {activePaths.map((p) => (
                        <Box
                          key={p.id}
                          p="xs"
                          style={{ border: "1px solid #e9ecef", borderRadius: 8, cursor: "pointer" }}
                          onClick={() => navigate(`/learning-path/${p.topic.id}`)}
                        >
                          <Group justify="space-between">
                            <Text size="sm" fw={600} lineClamp={1}>
                              {p.topic.name}
                            </Text>
                            <Badge size="xs" color="blue" variant="light">
                              {Math.round(p.progress_percentage)}%
                            </Badge>
                          </Group>
                          <Progress value={p.progress_percentage} size="xs" mt={6} color="blue" />
                        </Box>
                      ))}
                    </Stack>
                  </>
                )}

                {inProgressSd.length > 0 && (
                  <>
                    <Text size="xs" c="dimmed" fw={600} mb={4}>
                      System design courses
                    </Text>
                    <Stack gap={4} mb="md">
                      {inProgressSd.map((c) => (
                        <Box
                          key={c.id}
                          p="xs"
                          style={{ border: "1px solid #e9ecef", borderRadius: 8, cursor: "pointer" }}
                          onClick={() => navigate(`/system-design/learn/${c.course.id}`)}
                        >
                          <Group justify="space-between">
                            <Text size="sm" fw={600} lineClamp={1}>
                              {c.course.name}
                            </Text>
                            <Group gap="xs">
                              {c.current_lesson && (
                                <Text size="xs" c="dimmed" lineClamp={1} style={{ maxWidth: 160 }}>
                                  {c.current_lesson.name}
                                </Text>
                              )}
                              <Button size="compact-xs" variant="subtle" leftSection={<FaPlay size={9} />}>
                                Continue
                              </Button>
                            </Group>
                          </Group>
                          <Progress value={c.progress_percentage} size="xs" mt={6} color="violet" />
                        </Box>
                      ))}
                    </Stack>
                  </>
                )}

                <Text size="xs" c="dimmed" fw={600} mb={4}>
                  Recent conversations
                </Text>
                <Stack gap={4}>
                  {recentConversations.length === 0 && (
                    <Text size="sm" c="dimmed">
                      No conversations yet — start with a{" "}
                      <b style={{ cursor: "pointer" }} onClick={() => navigate("/topics")}>
                        learning path
                      </b>
                      .
                    </Text>
                  )}
                  {recentConversations.map((c) => (
                    <Box
                      key={c.id}
                      p="xs"
                      style={{ border: "1px solid #e9ecef", borderRadius: 8, cursor: "pointer" }}
                      onClick={() => navigate(conversationHref(c.id, c.conversation_type))}
                    >
                      <Group justify="space-between">
                        <Text size="sm" fw={500} lineClamp={1}>
                          {c.title}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {new Date(c.last_active_at).toLocaleDateString()}
                        </Text>
                      </Group>
                    </Box>
                  ))}
                </Stack>
              </Card>
            </Stack>

            <Stack gap="lg">
              <Card withBorder radius="md" p="lg">
                <Group justify="space-between" mb="xs">
                  <Text fw={600} size="sm">
                    Focus Areas
                  </Text>
                  <Button size="compact-xs" variant="subtle" onClick={() => navigate("/challenges")}>
                    All problems
                  </Button>
                </Group>
                {focus.topics.length > 0 && (
                  <>
                    <Text size="xs" c="dimmed" mb={6}>
                      Topics you've attempted but not mastered
                    </Text>
                    <Group gap={6} mb="md" wrap="wrap">
                      {focus.topics.map((t) => (
                        <Badge key={t} color="orange" variant="light">
                          {t}
                        </Badge>
                      ))}
                    </Group>
                  </>
                )}
                {focus.weak.length > 0 ? (
                  <Stack gap={4}>
                    {focus.weak.map((p) => (
                      <Box
                        key={p.problem_id}
                        p="xs"
                        style={{ border: "1px solid #e9ecef", borderRadius: 8, cursor: "pointer" }}
                        onClick={() => navigate(`/challenges/${p.problem_id}`)}
                      >
                        <Group justify="space-between">
                          <Group gap="xs">
                            <FaTimesCircle color="red" size={14} />
                            <Text size="sm" fw={500}>
                              {p.title}
                            </Text>
                          </Group>
                          <Button size="compact-xs" variant="filled" color="teal">
                            Retry
                          </Button>
                        </Group>
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Text size="sm" c="dimmed">
                    {stats.solved > 0
                      ? "All attempted problems are solved — pick a new one!"
                      : "Attempt a coding problem to start building your focus areas."}
                  </Text>
                )}
              </Card>

              <Card withBorder radius="md" p="lg">
                <Text fw={600} size="sm" mb="xs">
                  System Design Case Studies
                </Text>
                <Group gap={6} mb="sm" wrap="wrap">
                  <Badge color="grape" variant="light">
                    reference architectures
                  </Badge>
                  <Badge color="grape" variant="light">
                    whiteboard integration
                  </Badge>
                </Group>
                <Button variant="light" color="grape" leftSection={<FaBook size={12} />} onClick={() => navigate("/system-design/case-studies")}>
                  Browse case studies
                </Button>
              </Card>

              <Card withBorder radius="md" p="lg">
                <Group justify="space-between" mb="xs">
                  <Text fw={600} size="sm">
                    Spaced Repetition
                  </Text>
                  {dueItems && dueItems.length > 0 && (
                    <Badge color="red" variant="filled">
                      {dueItems.length} due
                    </Badge>
                  )}
                </Group>
                <Text size="sm" c="dimmed" mb="sm">
                  Failed problems are scheduled here automatically so you review them before they decay.
                </Text>
                <Button variant="light" color="indigo" leftSection={<FaRedoAlt size={12} />} onClick={() => navigate("/revision")}>
                  Open review queue
                </Button>
              </Card>
            </Stack>
          </SimpleGrid>
        </>
      )}
    </Box>
  );
};
import { useMemo } from "react";
import { Text, Card, Badge, Group, Box, Stack, Button, Code, Anchor, Divider } from "@mantine/core";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { FaArrowLeft, FaCheckCircle, FaDotCircle, FaLightbulb, FaExclamationTriangle, FaPlay, FaComments } from "react-icons/fa";
import { getProblems, getMyProblemProgress } from "../api/challenges";
import { createComponentTutor } from "../api/systemDesign";
import { Page, EmptyState, difficultyColor } from "./ui";
import { PATTERNS } from "../data/patterns";
import { PATTERN_INTERACTIVE } from "../data/patternInteractive";
import { DrillCard, WalkthroughCard } from "./PatternInteractive";

type Status = "solved" | "attempted" | "todo";
const DIFF_ORDER = ["easy", "medium", "hard"] as const;

export const PatternDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const pattern = PATTERNS.find((p) => p.slug === slug);
  const interactive = PATTERN_INTERACTIVE[slug ?? ""];

  const { data: problems } = useQuery({ queryKey: ["coding-problems"], queryFn: getProblems });
  const { data: progress } = useQuery({ queryKey: ["my-progress"], queryFn: getMyProblemProgress });

  const bySlug = useMemo(() => {
    const m: Record<string, { id: string; title: string; difficulty: string }> = {};
    (problems ?? []).forEach((p) => (m[p.slug] = { id: p.id, title: p.title, difficulty: p.difficulty }));
    return m;
  }, [problems]);

  const statusById = useMemo(() => {
    const m: Record<string, Status> = {};
    (progress ?? []).forEach((p) => (m[p.problem_id] = p.solved ? "solved" : p.attempts > 0 ? "attempted" : "todo"));
    return m;
  }, [progress]);

  const resolved = useMemo(
    () => (pattern?.problemSlugs ?? []).map((s) => bySlug[s]).filter(Boolean) as { id: string; title: string; difficulty: string }[],
    [pattern, bySlug]
  );

  const tutorMutation = useMutation({
    mutationFn: () => createComponentTutor(pattern!.slug),
    onSuccess: ({ conversation_id }) => navigate(`/component-tutor/${conversation_id}`),
  });

  if (!pattern) {
    return (
      <Page>
        <EmptyState icon={<FaLightbulb />} iconColor="teal" title="Pattern not found."
          action={<Button variant="light" onClick={() => navigate("/patterns")}>Back to Patterns</Button>} />
      </Page>
    );
  }

  const statusOf = (id: string): Status => statusById[id] ?? "todo";
  const solvedCount = resolved.filter((p) => statusOf(p.id) === "solved").length;
  const firstUnsolved = resolved.find((p) => statusOf(p.id) !== "solved");

  return (
    <Page>
      <Anchor component="button" onClick={() => navigate("/patterns")} c="dimmed" mb="md"
        style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}>
        <FaArrowLeft size={11} /> Patterns
      </Anchor>

      <Group justify="space-between" mb="xs" wrap="wrap" gap="sm">
        <Text size="xl" fw={700}>{pattern.name}</Text>
        <Group gap="sm">
          <Badge size="lg" variant="light" color={solvedCount === resolved.length && resolved.length > 0 ? "teal" : "gray"}>
            {solvedCount}/{resolved.length} solved
          </Badge>
          {firstUnsolved && (
            <Button color="teal" leftSection={<FaPlay size={11} />} onClick={() => navigate(`/challenges/${firstUnsolved.id}`)}>
              {solvedCount === 0 ? "Start" : "Continue"}
            </Button>
          )}
        </Group>
      </Group>

      <Box style={{ maxWidth: 860 }}>
        {/* Lesson */}
        <Stack gap="lg" mb="xl">
          <Box>
            <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb={6} style={{ letterSpacing: 0.6 }}>
              Recognize it when
            </Text>
            <Text size="sm" style={{ lineHeight: 1.6 }}>{pattern.cue}</Text>
          </Box>
          <Box>
            <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb={6} style={{ letterSpacing: 0.6 }}>
              The idea
            </Text>
            <Text size="sm" style={{ lineHeight: 1.6 }}>{pattern.idea}</Text>
          </Box>
          <Box>
            <Group justify="space-between" mb={6}>
              <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: 0.6 }}>
                Template
              </Text>
              <Badge variant="light" color="gray">{pattern.complexity}</Badge>
            </Group>
            <Code block style={{ whiteSpace: "pre", fontSize: 12.5, overflow: "auto" }}>
              {pattern.template}
            </Code>
          </Box>
          <Box>
            <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="sm" style={{ letterSpacing: 0.6 }}>
              Common pitfalls
            </Text>
            <Stack gap={6}>
              {pattern.pitfalls.map((p, i) => (
                <Group key={i} gap={8} wrap="nowrap" align="flex-start">
                  <Box style={{ color: "var(--mantine-color-orange-6)", display: "inline-flex", fontSize: 12, marginTop: 3, flexShrink: 0 }}>
                    <FaExclamationTriangle />
                  </Box>
                  <Text size="sm" c="dimmed" style={{ lineHeight: 1.5 }}>{p}</Text>
                </Group>
              ))}
            </Stack>
          </Box>
        </Stack>

        {interactive && (
          <>
            <Divider label="Worked example" labelPosition="center" mb="lg" />
            <Box mb="xl">
              <WalkthroughCard walkthrough={interactive.walkthrough} />
            </Box>

            <Divider label="Spot the pattern" labelPosition="center" mb="lg" />
            <Text size="sm" c="dimmed" mb="md">
              The real interview skill is recognizing the pattern from the problem statement. Try these.
            </Text>
            <Stack gap="md" mb="xl">
              {interactive.drills.map((d, i) => (
                <DrillCard key={i} drill={d} index={i} />
              ))}
            </Stack>

            <Card withBorder radius="md" p="lg" mb="xl" style={{ background: "var(--app-sunken)" }}>
              <Group justify="space-between" wrap="wrap" gap="md">
                <Box style={{ flex: 1, minWidth: 220 }}>
                  <Text fw={600} mb={2}>Practice with the tutor</Text>
                  <Text size="sm" c="dimmed" style={{ lineHeight: 1.5 }}>
                    A live Socratic session on {pattern.name.toLowerCase()} — the tutor poses scenarios, asks you to reason, and corrects your thinking.
                  </Text>
                </Box>
                <Button
                  leftSection={<FaComments size={14} />}
                  color="violet"
                  loading={tutorMutation.isPending}
                  onClick={() => tutorMutation.mutate()}
                >
                  Practice with tutor
                </Button>
              </Group>
            </Card>
          </>
        )}

        <Divider label="Practice — easy to hard" labelPosition="center" mb="lg" />

        {/* Problems graded by difficulty */}
        {DIFF_ORDER.map((diff) => {
          const items = resolved.filter((p) => p.difficulty === diff);
          if (!items.length) return null;
          return (
            <Box key={diff} mb="lg">
              <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="xs" style={{ letterSpacing: 0.6 }}>
                {diff}
              </Text>
              <Stack gap={6}>
                {items.map((p) => {
                  const st = statusOf(p.id);
                  return (
                    <Card key={p.id} withBorder p="sm" radius="sm" className="app-hover-lift"
                      style={{ cursor: "pointer" }} onClick={() => navigate(`/challenges/${p.id}`)}>
                      <Group justify="space-between" wrap="nowrap">
                        <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
                          {st === "solved" ? (
                            <FaCheckCircle size={13} style={{ color: "var(--mantine-color-teal-6)", flexShrink: 0 }} />
                          ) : st === "attempted" ? (
                            <FaDotCircle size={12} style={{ color: "var(--mantine-color-orange-6)", flexShrink: 0 }} />
                          ) : (
                            <Box style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid var(--app-line)", flexShrink: 0 }} />
                          )}
                          <Text size="sm" fw={500} truncate>{p.title}</Text>
                        </Group>
                        <Badge size="xs" variant="light" color={difficultyColor(p.difficulty)}>
                          {p.difficulty}
                        </Badge>
                      </Group>
                    </Card>
                  );
                })}
              </Stack>
            </Box>
          );
        })}
      </Box>
    </Page>
  );
};

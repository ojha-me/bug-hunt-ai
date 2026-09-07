import { useMemo } from "react";
import { Text, Card, Badge, Group, Box, Stack, Button, Code, Anchor, Divider, Table } from "@mantine/core";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { FaArrowLeft, FaCheckCircle, FaDotCircle, FaComments, FaCubes } from "react-icons/fa";
import { getProblems, getMyProblemProgress } from "../api/challenges";
import { createComponentTutor } from "../api/systemDesign";
import { Page, EmptyState, difficultyColor } from "./ui";
import { FOUNDATIONS } from "../data/foundations";

type Status = "solved" | "attempted" | "todo";

export const FoundationDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const foundation = FOUNDATIONS.find((f) => f.slug === slug);

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
    () => (foundation?.problemSlugs ?? []).map((s) => bySlug[s]).filter(Boolean) as { id: string; title: string; difficulty: string }[],
    [foundation, bySlug]
  );

  const tutorMutation = useMutation({
    mutationFn: () => createComponentTutor(foundation!.slug),
    onSuccess: ({ conversation_id }) => navigate(`/patterns/learn/${conversation_id}`),
  });

  if (!foundation) {
    return (
      <Page>
        <EmptyState icon={<FaCubes />} iconColor="indigo" title="Topic not found."
          action={<Button variant="light" onClick={() => navigate("/foundations")}>Back to Foundations</Button>} />
      </Page>
    );
  }

  const statusOf = (id: string): Status => statusById[id] ?? "todo";

  return (
    <Page>
      <Anchor component="button" onClick={() => navigate("/foundations")} c="dimmed" mb="md"
        style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}>
        <FaArrowLeft size={11} /> Foundations
      </Anchor>

      <Group justify="space-between" mb="lg" wrap="wrap" gap="sm">
        <Text size="xl" fw={700}>{foundation.name}</Text>
        <Button color="violet" leftSection={<FaComments size={12} />} loading={tutorMutation.isPending} onClick={() => tutorMutation.mutate()}>
          Learn with tutor
        </Button>
      </Group>

      <Box style={{ maxWidth: 820 }}>
        <Stack gap="xl" mb="xl">
          <Box>
            <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb={6} style={{ letterSpacing: 0.6 }}>What it is</Text>
            <Text size="sm" style={{ lineHeight: 1.6 }}>{foundation.whatItIs}</Text>
          </Box>

          <Box>
            <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="xs" style={{ letterSpacing: 0.6 }}>Key operations & Big-O</Text>
            <Table withTableBorder withColumnBorders>
              <Table.Tbody>
                {foundation.operations.map((o, i) => (
                  <Table.Tr key={i}>
                    <Table.Td><Text size="sm">{o.op}</Text></Table.Td>
                    <Table.Td style={{ width: 120 }}>
                      <Badge variant="light" color="gray" style={{ fontFamily: "var(--mantine-font-family-monospace)" }}>{o.big_o}</Badge>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Box>

          <Box>
            <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb={6} style={{ letterSpacing: 0.6 }}>In Python</Text>
            <Code block style={{ whiteSpace: "pre", fontSize: 12.5, overflow: "auto" }}>{foundation.inPython}</Code>
          </Box>

          <Box>
            <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb={6} style={{ letterSpacing: 0.6 }}>When to use</Text>
            <Text size="sm" style={{ lineHeight: 1.6 }}>{foundation.whenToUse}</Text>
          </Box>
        </Stack>

        <Card withBorder radius="md" p="lg" mb="xl" style={{ background: "var(--app-sunken)" }}>
          <Group justify="space-between" wrap="wrap" gap="md">
            <Box style={{ flex: 1, minWidth: 220 }}>
              <Text fw={600} mb={2}>Learn {foundation.name.toLowerCase()} with the tutor</Text>
              <Text size="sm" c="dimmed" style={{ lineHeight: 1.5 }}>
                The AI tutor teaches it hands-on: explains the idea, gives you small exercises to implement and run in the editor, then reviews your code.
              </Text>
            </Box>
            <Button leftSection={<FaComments size={14} />} color="violet" loading={tutorMutation.isPending} onClick={() => tutorMutation.mutate()}>
              Learn with tutor
            </Button>
          </Group>
        </Card>

        {resolved.length > 0 && (
          <>
            <Divider label="Practice with these" labelPosition="center" mb="lg" />
            <Stack gap={6}>
              {resolved.map((p) => {
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
                      <Badge size="xs" variant="light" color={difficultyColor(p.difficulty)}>{p.difficulty}</Badge>
                    </Group>
                  </Card>
                );
              })}
            </Stack>
          </>
        )}
      </Box>
    </Page>
  );
};

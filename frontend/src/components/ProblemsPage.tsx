import { useState, useMemo } from "react";
import {
  Text,
  Button,
  Group,
  Badge,
  Card,
  SimpleGrid,
  SegmentedControl,
  TextInput,
  Chip,
  Select,
  Box,
} from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FaCode, FaArrowRight, FaSearch, FaCheckCircle, FaDotCircle } from "react-icons/fa";
import { getProblems, getProblemLists, getMyProblemProgress } from "../api/challenges";
import { Page, PageHeader, GridSkeleton, difficultyColor } from "./ui";

type Status = "solved" | "attempted" | "todo";

export const ProblemsPage = () => {
  const navigate = useNavigate();
  const { data: problems, isLoading } = useQuery({
    queryKey: ["coding-problems"],
    queryFn: getProblems,
  });
  const { data: lists } = useQuery({ queryKey: ["problem-lists"], queryFn: getProblemLists });
  const { data: progress } = useQuery({ queryKey: ["my-progress"], queryFn: getMyProblemProgress });

  const [difficulty, setDifficulty] = useState<string>("all");
  const [topic, setTopic] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [listSlug, setListSlug] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");

  const statusById = useMemo(() => {
    const m: Record<string, Status> = {};
    (progress ?? []).forEach((p) => {
      m[p.problem_id] = p.solved ? "solved" : p.attempts > 0 ? "attempted" : "todo";
    });
    return m;
  }, [progress]);
  const statusOf = (id: string): Status => statusById[id] ?? "todo";

  const topics = useMemo(() => {
    const set = new Set<string>();
    (problems ?? []).forEach((p) => p.topics.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [problems]);

  const activeList = useMemo(
    () => (listSlug === "all" ? null : lists?.find((l) => l.slug === listSlug) ?? null),
    [lists, listSlug]
  );
  const listOrder = useMemo(
    () => (activeList ? new Map(activeList.problem_slugs.map((s, i) => [s, i])) : null),
    [activeList]
  );

  const filtered = useMemo(() => {
    let list = problems ?? [];
    if (listOrder) list = list.filter((p) => listOrder.has(p.slug));
    if (difficulty !== "all") list = list.filter((p) => p.difficulty === difficulty);
    if (topic !== "all") list = list.filter((p) => p.topics.includes(topic));
    if (status !== "all") list = list.filter((p) => statusOf(p.id) === status);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) => p.title.toLowerCase().includes(q) || p.topics.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (listOrder) list = [...list].sort((a, b) => listOrder.get(a.slug)! - listOrder.get(b.slug)!);
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problems, listOrder, difficulty, topic, status, search, statusById]);

  const solvedCount = useMemo(() => (progress ?? []).filter((p) => p.solved).length, [progress]);
  const totalCount = problems?.length ?? 0;

  return (
    <Page>
      <PageHeader
        icon={<FaCode size={14} />}
        iconColor="teal"
        title="Problem Library"
        subtitle="Practice curated coding challenges with AI-graded test cases."
        right={
          <Badge size="lg" variant="light" color="teal">
            {solvedCount}/{totalCount} solved
          </Badge>
        }
      />

      <Group mb="md" justify="space-between" wrap="wrap" gap="sm">
        <Group gap="sm" wrap="wrap">
          <Select
            size="xs"
            w={210}
            value={listSlug}
            onChange={(v) => setListSlug(v ?? "all")}
            data={[
              { label: "All problems", value: "all" },
              ...(lists ?? []).map((l) => ({ label: `${l.name} (${l.count})`, value: l.slug })),
            ]}
            allowDeselect={false}
          />
          <SegmentedControl
            size="xs"
            value={difficulty}
            onChange={setDifficulty}
            data={[
              { label: "All", value: "all" },
              { label: "Easy", value: "easy" },
              { label: "Medium", value: "medium" },
              { label: "Hard", value: "hard" },
            ]}
          />
          <SegmentedControl
            size="xs"
            value={status}
            onChange={setStatus}
            data={[
              { label: "Any", value: "all" },
              { label: "To do", value: "todo" },
              { label: "Attempted", value: "attempted" },
              { label: "Solved", value: "solved" },
            ]}
          />
          <TextInput
            size="xs"
            placeholder="Search problems..."
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            leftSection={<FaSearch size={12} />}
            w={200}
          />
        </Group>
        {topic !== "all" && (
          <Button size="xs" variant="subtle" color="gray" onClick={() => setTopic("all")}>
            Clear topic: {topic}
          </Button>
        )}
      </Group>

      {activeList && (
        <Text size="sm" c="dimmed" mb="md" style={{ maxWidth: 760 }}>
          {activeList.description}
        </Text>
      )}

      <Group gap={6} mb="lg" wrap="wrap">
        <Chip size="xs" checked={topic === "all"} onChange={() => setTopic("all")}>
          all
        </Chip>
        {topics.map((t) => (
          <Chip key={t} size="xs" checked={topic === t} onChange={() => setTopic(t)}>
            {t}
          </Chip>
        ))}
      </Group>

      {isLoading ? (
        <GridSkeleton cards={6} />
      ) : filtered.length ? (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg" className="app-stagger">
          {filtered.map((problem) => {
            const st = statusOf(problem.id);
            return (
              <Card
                key={problem.id}
                withBorder
                p="lg"
                className="app-hover-lift"
                style={{ display: "flex", flexDirection: "column" }}
              >
                <Group justify="space-between" mb="sm">
                  <Badge variant="light" color={difficultyColor(problem.difficulty)}>
                    {problem.difficulty}
                  </Badge>
                  {st === "solved" ? (
                    <Group gap={4}>
                      <FaCheckCircle size={13} style={{ color: "var(--mantine-color-teal-6)" }} />
                      <Text size="xs" c="teal" fw={600}>
                        Solved
                      </Text>
                    </Group>
                  ) : st === "attempted" ? (
                    <Group gap={4}>
                      <FaDotCircle size={12} style={{ color: "var(--mantine-color-orange-6)" }} />
                      <Text size="xs" c="dimmed">
                        Attempted
                      </Text>
                    </Group>
                  ) : null}
                </Group>
                <Text fw={600} size="md">
                  {problem.title}
                </Text>
                <Group gap={4} mt="sm" mb="md" wrap="wrap">
                  {problem.topics.map((t) => (
                    <Badge key={t} size="xs" variant="filled" color="gray">
                      {t}
                    </Badge>
                  ))}
                </Group>
                <Button
                  mt="auto"
                  fullWidth
                  variant={st === "solved" ? "subtle" : "light"}
                  color="teal"
                  leftSection={<FaArrowRight size={12} />}
                  onClick={() => navigate(`/challenges/${problem.id}`)}
                >
                  {st === "todo" ? "Solve" : st === "attempted" ? "Keep trying" : "Review"}
                </Button>
              </Card>
            );
          })}
        </SimpleGrid>
      ) : (
        <Box ta="center" pt="xl">
          <Text c="dimmed">No problems match your filters.</Text>
        </Box>
      )}
    </Page>
  );
};

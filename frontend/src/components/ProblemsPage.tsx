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
} from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FaCode, FaArrowRight, FaSearch } from "react-icons/fa";
import { getProblems } from "../api/challenges";
import { Page, PageHeader, GridSkeleton, difficultyColor } from "./ui";

export const ProblemsPage = () => {
  const navigate = useNavigate();
  const { data: problems, isLoading } = useQuery({
    queryKey: ["coding-problems"],
    queryFn: getProblems,
  });

  const [difficulty, setDifficulty] = useState<string>("all");
  const [topic, setTopic] = useState<string>("all");
  const [search, setSearch] = useState("");

  const topics = useMemo(() => {
    const set = new Set<string>();
    (problems ?? []).forEach((p) => p.topics.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [problems]);

  const filtered = useMemo(() => {
    let list = problems ?? [];
    if (difficulty !== "all") list = list.filter((p) => p.difficulty === difficulty);
    if (topic !== "all") list = list.filter((p) => p.topics.includes(topic));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) => p.title.toLowerCase().includes(q) || p.topics.some((t) => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [problems, difficulty, topic, search]);

  return (
    <Page>
      <PageHeader
        icon={<FaCode size={14} />}
        iconColor="teal"
        title="Problem Library"
        subtitle="Practice curated coding challenges with AI-graded test cases."
      />

      <Group mb="md" justify="space-between" wrap="wrap">
        <Group gap="sm" wrap="wrap">
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
          <TextInput
            size="xs"
            placeholder="Search problems..."
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            leftSection={<FaSearch size={12} />}
            w={220}
          />
        </Group>
        {topic !== "all" && (
          <Button size="xs" variant="subtle" color="gray" onClick={() => setTopic("all")}>
            Clear topic: {topic}
          </Button>
        )}
      </Group>

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
          {filtered.map((problem) => (
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
                {problem.stats && problem.stats.attempts > 0 && (
                  <Text size="xs" c="dimmed">
                    solved by {problem.stats.solved_by_users} · {problem.stats.attempts} attempts
                  </Text>
                )}
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
                variant="light"
                color="teal"
                leftSection={<FaArrowRight size={12} />}
                onClick={() => navigate(`/challenges/${problem.id}`)}
              >
                Solve
              </Button>
            </Card>
          ))}
        </SimpleGrid>
      ) : (
        <Text c="dimmed" ta="center" pt="xl">
          No problems match your filters.
        </Text>
      )}
    </Page>
  );
};
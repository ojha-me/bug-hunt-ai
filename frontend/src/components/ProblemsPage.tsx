import { useState, useMemo } from "react";
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
  SegmentedControl,
  TextInput,
  Chip,
} from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FaCode, FaArrowRight, FaSearch } from "react-icons/fa";
import { getProblems } from "../api/challenges";
import type { Difficulty } from "../types/challenges/api_types";

const difficultyColor = (d: Difficulty) =>
  d === "easy" ? "green" : d === "medium" ? "yellow" : "red";

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
    <Box p="md" style={{ height: "100vh", overflowY: "auto", background: "#f9f9f9" }}>
      <Group mb="lg">
        <Badge size="lg" variant="light" color="teal">
          <FaCode size={12} style={{ marginRight: 4 }} />
          Coding
        </Badge>
        <Text size="xl" fw={700}>
          Problem Library
        </Text>
      </Group>

      <Group mb="md" justify="space-between" wrap="wrap">
        <Group gap="sm">
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
            ✕ {topic}
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
        <Box p="xl" ta="center">
          <Loader />
        </Box>
      ) : filtered.length ? (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
          {filtered.map((problem) => (
            <Card key={problem.id} withBorder radius="md" p="lg">
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
        <Stack gap="sm" pt="xl" ta="center">
          <Text c="dimmed">No problems match your filters.</Text>
        </Stack>
      )}
    </Box>
  );
};
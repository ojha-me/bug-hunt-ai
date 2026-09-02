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
  Title,
  SimpleGrid,
} from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FaRedoAlt, FaCheckCircle, FaExternalLinkAlt } from "react-icons/fa";
import { getDueRevisionItems, getAllRevisionItems, reviewRevisionItem } from "../api/revision";

const difficultyColor = (d: string) =>
  d === "easy" ? "green" : d === "medium" ? "yellow" : "red";

export const RevisionPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: dueItems, isLoading, isError } = useQuery({
    queryKey: ["revision-due"],
    queryFn: getDueRevisionItems,
  });

  const { data: allItems, isLoading: allLoading } = useQuery({
    queryKey: ["revision-items"],
    queryFn: getAllRevisionItems,
  });

  const reviewMutation = useMutation({
    mutationFn: ({ itemId, quality }: { itemId: number; quality: number }) =>
      reviewRevisionItem(itemId, quality),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revision-due"] });
      queryClient.invalidateQueries({ queryKey: ["revision-items"] });
    },
  });

  const upcoming = useMemo(
    () =>
      (allItems ?? [])
        .filter((i) => new Date(i.due_at).getTime() > Date.now())
        .sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime())
        .slice(0, 10),
    [allItems]
  );

  const review = (itemId: number, quality: number) => reviewMutation.mutate({ itemId, quality });

  return (
    <Box p="md" style={{ height: "100vh", overflowY: "auto", background: "#f9f9f9" }}>
      <Group mb="lg">
        <Badge size="lg" variant="light" color="indigo">
          <FaRedoAlt size={12} style={{ marginRight: 4 }} />
          Review
        </Badge>
        <Title order={3}>Revision Queue</Title>
        <Text size="sm" c="dimmed">
          {isLoading ? "…" : dueItems?.length ? `${dueItems.length} item(s) due now` : "All caught up"}
        </Text>
      </Group>

      {isLoading || allLoading ? (
        <Box p="xl" ta="center">
          <Loader />
        </Box>
      ) : isError ? (
        <Box p="xl">
          <Text size="sm" c="red">
            Could not load your review queue.
          </Text>
        </Box>
      ) : (dueItems?.length ?? 0) === 0 ? (
        <Stack gap="sm" pt="xl" ta="center">
          <FaCheckCircle size={40} color="green" style={{ alignSelf: "center" }} />
          <Text size="md">Nothing due right now.</Text>
          <Text size="sm" c="dimmed">
            Fail a coding problem and it&apos;s automatically scheduled here for spaced repetition.
          </Text>
          <Group justify="center" mt="sm">
            <Button color="teal" onClick={() => navigate("/challenges")}>
              Practice coding problems
            </Button>
          </Group>
        </Stack>
      ) : (
        <>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg" mb="lg">
            {dueItems?.map((item) => (
              <Card key={item.id} withBorder radius="md" p="lg">
                <Group justify="space-between" mb="sm">
                  <Badge variant="light" color={difficultyColor(item.difficulty)}>
                    {item.difficulty}
                  </Badge>
                  <Badge size="xs" color="red" variant="filled">
                    due now
                  </Badge>
                </Group>
                <Text fw={600} size="md">
                  {item.title}
                </Text>
                <Group gap={4} mt="sm" mb="md" wrap="wrap">
                  {item.topics.map((t) => (
                    <Badge key={t} size="xs" variant="filled" color="gray">
                      {t}
                    </Badge>
                  ))}
                </Group>
                {item.problem_id && (
                  <Button
                    variant="subtle"
                    size="compact-xs"
                    leftSection={<FaExternalLinkAlt size={10} />}
                    onClick={() => navigate(`/challenges/${item.problem_id}`)}
                    mb="sm"
                  >
                    Open problem
                  </Button>
                )}
                <Group gap="xs" mt="sm">
                  <Button size="compact-xs" color="red" variant="light" onClick={() => review(item.id, 0)}>
                    Again
                  </Button>
                  <Button size="compact-xs" color="yellow" variant="light" onClick={() => review(item.id, 2)}>
                    Hard
                  </Button>
                  <Button size="compact-xs" color="blue" variant="light" onClick={() => review(item.id, 3)}>
                    Good
                  </Button>
                  <Button size="compact-xs" color="green" variant="light" onClick={() => review(item.id, 4)}>
                    Easy
                  </Button>
                </Group>
                <Text size="xs" c="dimmed" mt="sm">
                  reviewed {item.repetitions}× · interval {item.interval_days}d
                </Text>
              </Card>
            ))}
          </SimpleGrid>

          {upcoming.length > 0 && (
            <>
              <Text size="sm" c="dimmed" fw={600} mb="xs">
                Upcoming
              </Text>
              <Stack gap={4}>
                {upcoming.map((item) => (
                  <Card key={item.id} withBorder radius="sm" p="sm">
                    <Group justify="space-between">
                      <Group gap="xs">
                        <Badge size="xs" variant="light" color={difficultyColor(item.difficulty)}>
                          {item.difficulty}
                        </Badge>
                        <Text size="sm" fw={500}>
                          {item.title}
                        </Text>
                      </Group>
                      <Text size="xs" c="dimmed">
                        {new Date(item.due_at).toLocaleString()}
                      </Text>
                    </Group>
                  </Card>
                ))}
              </Stack>
            </>
          )}
        </>
      )}
    </Box>
  );
};
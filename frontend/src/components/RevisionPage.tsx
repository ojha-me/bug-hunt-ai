import { useMemo } from "react";
import {
  Text,
  Button,
  Stack,
  Group,
  Badge,
  Card,
  SimpleGrid,
} from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FaRedoAlt, FaCheckCircle, FaExternalLinkAlt } from "react-icons/fa";
import { getDueRevisionItems, getAllRevisionItems, reviewRevisionItem } from "../api/revision";
import { Page, PageHeader, GridSkeleton, EmptyState, difficultyColor } from "./ui";

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
    <Page>
      <PageHeader
        icon={<FaRedoAlt size={14} />}
        iconColor="indigo"
        title="Revision Queue"
        subtitle={
          isLoading ? "…" : dueItems?.length ? `${dueItems.length} item(s) due now` : "All caught up"
        }
      />

      {isLoading || allLoading ? (
        <GridSkeleton cards={3} />
      ) : isError ? (
        <EmptyState icon={<FaRedoAlt />} iconColor="red" title="Could not load your review queue." />
      ) : (dueItems?.length ?? 0) === 0 ? (
        <EmptyState
          icon={<FaCheckCircle />}
          iconColor="green"
          title="Nothing due right now."
          description="Fail a coding problem and it's automatically scheduled here for spaced repetition."
          action={
            <Button color="teal" onClick={() => navigate("/challenges")}>
              Practice coding problems
            </Button>
          }
        />
      ) : (
        <>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg" mb="lg" className="app-stagger">
            {dueItems?.map((item) => (
              <Card key={item.id} withBorder p="lg" className="app-hover-lift">
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
                  <Card key={item.id} withBorder p="sm" className="app-hover-lift" radius="md">
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
    </Page>
  );
};
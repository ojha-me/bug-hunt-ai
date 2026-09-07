import { useMemo } from "react";
import { Text, Card, Badge, Group, SimpleGrid, Progress } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FaCubes, FaArrowRight } from "react-icons/fa";
import { getProblems, getMyProblemProgress } from "../api/challenges";
import { Page, PageHeader, GridSkeleton } from "./ui";
import { FOUNDATIONS } from "../data/foundations";

export const FoundationsPage = () => {
  const navigate = useNavigate();
  const { data: problems, isLoading } = useQuery({ queryKey: ["coding-problems"], queryFn: getProblems });
  const { data: progress } = useQuery({ queryKey: ["my-progress"], queryFn: getMyProblemProgress });

  const idBySlug = useMemo(() => {
    const m: Record<string, string> = {};
    (problems ?? []).forEach((p) => (m[p.slug] = p.id));
    return m;
  }, [problems]);
  const solvedIds = useMemo(
    () => new Set((progress ?? []).filter((p) => p.solved).map((p) => p.problem_id)),
    [progress]
  );

  const statOf = (slugs: string[]) => {
    const present = slugs.filter((s) => idBySlug[s]);
    return { total: present.length, solved: present.filter((s) => solvedIds.has(idBySlug[s])).length };
  };

  return (
    <Page>
      <PageHeader
        icon={<FaCubes size={14} />}
        iconColor="indigo"
        title="Data Structure Foundations"
        subtitle="Start here. Learn the building blocks — arrays, hash maps, stacks, trees, heaps, graphs — hands-on with the AI tutor, before moving on to the Patterns that use them."
      />

      {isLoading ? (
        <GridSkeleton cards={6} />
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg" className="app-stagger">
          {FOUNDATIONS.map((f, i) => {
            const { total, solved } = statOf(f.problemSlugs);
            const pct = total ? Math.round((solved / total) * 100) : 0;
            return (
              <Card
                key={f.slug}
                withBorder
                p="lg"
                className="app-hover-lift"
                style={{ cursor: "pointer", display: "flex", flexDirection: "column" }}
                onClick={() => navigate(`/foundations/${f.slug}`)}
              >
                <Group justify="space-between" mb={6}>
                  <Badge variant="light" color="gray" size="sm">{String(i + 1).padStart(2, "0")}</Badge>
                  {total > 0 && (
                    <Badge variant="light" color={solved === total ? "teal" : "gray"}>{solved}/{total} solved</Badge>
                  )}
                </Group>
                <Text fw={650} size="md">{f.name}</Text>
                <Text size="sm" c="dimmed" mt={6} lineClamp={3} style={{ flex: 1 }}>{f.whatItIs}</Text>
                {total > 0 && <Progress value={pct} size="xs" mt="md" color="indigo" />}
                <Group justify="flex-end" mt="sm">
                  <FaArrowRight size={12} style={{ color: "var(--mantine-color-dimmed)" }} />
                </Group>
              </Card>
            );
          })}
        </SimpleGrid>
      )}
    </Page>
  );
};

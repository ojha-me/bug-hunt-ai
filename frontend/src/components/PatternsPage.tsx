import { useMemo } from "react";
import { Text, Card, Badge, Group, SimpleGrid, Progress } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FaLayerGroup, FaArrowRight } from "react-icons/fa";
import { getProblems, getMyProblemProgress } from "../api/challenges";
import { Page, PageHeader, GridSkeleton } from "./ui";
import { PATTERNS } from "../data/patterns";

export const PatternsPage = () => {
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
    const solved = present.filter((s) => solvedIds.has(idBySlug[s])).length;
    return { total: present.length, solved };
  };

  return (
    <Page>
      <PageHeader
        icon={<FaLayerGroup size={14} />}
        iconColor="teal"
        title="Patterns"
        subtitle="Learn the pattern, then apply it. Each track teaches the recognition cue, the core idea, and a code template — then drills it across easy → medium → hard problems."
      />

      {isLoading ? (
        <GridSkeleton cards={6} />
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg" className="app-stagger">
          {PATTERNS.map((pat, i) => {
            const { total, solved } = statOf(pat.problemSlugs);
            const pct = total ? Math.round((solved / total) * 100) : 0;
            return (
              <Card
                key={pat.slug}
                withBorder
                p="lg"
                className="app-hover-lift"
                style={{ cursor: "pointer", display: "flex", flexDirection: "column" }}
                onClick={() => navigate(`/patterns/${pat.slug}`)}
              >
                <Group justify="space-between" mb={6}>
                  <Badge variant="light" color="gray" size="sm">
                    {String(i + 1).padStart(2, "0")}
                  </Badge>
                  <Badge variant="light" color={solved === total && total > 0 ? "teal" : "gray"}>
                    {solved}/{total} solved
                  </Badge>
                </Group>
                <Text fw={650} size="md">
                  {pat.name}
                </Text>
                <Text size="sm" c="dimmed" mt={6} lineClamp={3} style={{ flex: 1 }}>
                  {pat.cue}
                </Text>
                <Progress value={pct} size="xs" mt="md" color="teal" />
                <Group justify="space-between" mt="sm">
                  <Text size="xs" c="dimmed">
                    {total} problem{total === 1 ? "" : "s"}
                  </Text>
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

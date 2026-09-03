import { Text, Button, Group, Badge, Card, SimpleGrid, Progress, Stack, Box } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FaDumbbell, FaPlay, FaCheck } from "react-icons/fa";
import { FaArrowRight } from "react-icons/fa";
import {
  getSDCaseStudies,
  getSDPracticeSessions,
  createSDPracticeSession,
} from "../api/systemDesign";
import { Page, PageHeader, GridSkeleton, EmptyState, difficultyColor } from "./ui";
import type { SDPracticeSessionResponse } from "../types/system_design/api_types";

export const SystemDesignPracticePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: caseStudies, isLoading: casesLoading } = useQuery({
    queryKey: ["sd-case-studies"],
    queryFn: getSDCaseStudies,
  });

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ["sd-practice-sessions"],
    queryFn: getSDPracticeSessions,
  });

  const startMutation = useMutation({
    mutationFn: createSDPracticeSession,
    onSuccess: (session: SDPracticeSessionResponse) => {
      queryClient.invalidateQueries({ queryKey: ["sd-practice-sessions"] });
      navigate(`/system-design/practice/${session.conversation_id}`);
    },
  });

  const inProgress = sessions?.filter((s) => s.status !== "completed") ?? [];
  const completed = sessions?.filter((s) => s.status === "completed") ?? [];

  const handleStart = (caseStudyId: string) => {
    const existing = inProgress.find((s) => s.case_study.id === caseStudyId);
    if (existing) {
      navigate(`/system-design/practice/${existing.conversation_id}`);
      return;
    }
    startMutation.mutate(caseStudyId);
  };

  return (
    <Page>
      <PageHeader
        icon={<FaDumbbell size={14} />}
        iconColor="teal"
        title="Design Drills"
        subtitle="Practice the full 5-phase thinking protocol against real case studies. Your interviewer walks you through Clarify, Estimate, Components, High-Level Design, and Deep Dives — one phase at a time, in order."
      />

      {(sessionsLoading || casesLoading) && <GridSkeleton cards={6} />}

      {inProgress.length > 0 && (
        <Box mb="xl">
          <Text size="sm" fw={700} mb="sm" c="dimmed">
            In progress
          </Text>
          <Stack gap="sm">
            {inProgress.map((s) => (
              <Card key={s.id} withBorder p="md" className="app-hover-lift" style={{ cursor: "pointer" }} onClick={() => navigate(`/system-design/practice/${s.conversation_id}`)}>
                <Group justify="space-between" wrap="nowrap">
                  <Group wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                    <Badge size="sm" variant="light" color="teal">
                      Phase {s.current_phase} of 5
                    </Badge>
                    <Text size="sm" fw={600} lineClamp={1} style={{ flex: 1 }}>
                      {s.case_study.title}
                    </Text>
                    <Badge size="sm" variant="light" color={difficultyColor(s.case_study.difficulty)}>
                      {s.case_study.difficulty}
                    </Badge>
                  </Group>
                  <Group wrap="nowrap" style={{ width: 200 }}>
                    <Progress value={(s.current_phase / 5) * 100} size="sm" color="teal" radius="xl" style={{ flex: 1 }} />
                    <Button size="compact-sm" variant="filled" color="teal" leftSection={<FaPlay size={10} />}>
                      Resume
                    </Button>
                  </Group>
                </Group>
              </Card>
            ))}
          </Stack>
        </Box>
      )}

      <Box>
        <Text size="sm" fw={700} mb="sm" c="dimmed">
          Start a new drill
        </Text>
        {caseStudies?.length ? (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg" className="app-stagger">
            {caseStudies.map((cs) => (
              <Card key={cs.id} withBorder p="lg" className="app-hover-lift" style={{ display: "flex", flexDirection: "column" }}>
                <Group justify="space-between" mb="sm">
                  <Badge variant="light" color={difficultyColor(cs.difficulty)}>
                    {cs.difficulty}
                  </Badge>
                </Group>
                <Text fw={600} size="md">
                  {cs.title}
                </Text>
                <Text size="sm" c="dimmed" mt={6} lineClamp={4} style={{ flex: 1 }}>
                  {cs.overview}
                </Text>
                <Group gap={4} mt="sm" mb="md" wrap="wrap">
                  {cs.topics.map((t) => (
                    <Badge key={t} size="xs" variant="filled" color="gray">
                      {t}
                    </Badge>
                  ))}
                </Group>
                <Button
                  fullWidth
                  variant={inProgress.some((s) => s.case_study.id === cs.id) ? "default" : "filled"}
                  color="teal"
                  loading={startMutation.isPending}
                  leftSection={inProgress.some((s) => s.case_study.id === cs.id) ? <FaCheck size={12} /> : <FaArrowRight size={12} />}
                  onClick={() => handleStart(cs.id)}
                >
                  {inProgress.some((s) => s.case_study.id === cs.id) ? "Resume drill" : "Start drill"}
                </Button>
              </Card>
            ))}
          </SimpleGrid>
        ) : (
          !sessionsLoading &&
          !casesLoading && <EmptyState icon={<FaDumbbell />} iconColor="teal" title="No case studies available yet." />
        )}
      </Box>

      {completed.length > 0 && (
        <Box mt="xl">
          <Text size="sm" fw={700} mb="sm" c="dimmed">
            Completed
          </Text>
          <Stack gap="sm">
            {completed.map((s) => (
              <Card key={s.id} withBorder p="md">
                <Group justify="space-between" wrap="nowrap">
                  <Group wrap="nowrap">
                    <Badge size="sm" variant="light" color="green">
                      Done
                    </Badge>
                    <Text size="sm" fw={600}>
                      {s.case_study.title}
                    </Text>
                  </Group>
                  <Button size="compact-sm" variant="subtle" color="teal" onClick={() => navigate(`/system-design/practice/${s.conversation_id}`)}>
                    Review
                  </Button>
                </Group>
              </Card>
            ))}
          </Stack>
        </Box>
      )}
    </Page>
  );
};
import { Box, Text, Button, Stack, Group, Badge, Card, Alert, Divider, Title, SimpleGrid, Skeleton } from "@mantine/core";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { FaArrowLeft, FaProjectDiagram, FaComments } from "react-icons/fa";
import { getSDCaseStudy } from "../api/systemDesign";
import { createConversation } from "../api/conversation";
import { SystemDesignDiagram } from "./SystemDesignDiagram";
import { Page, difficultyColor } from "./ui";

export const SDCaseStudyDetailPage = () => {
  const { caseStudyId } = useParams<{ caseStudyId: string }>();
  const navigate = useNavigate();

  const { data: study, isLoading, isError } = useQuery({
    queryKey: ["sd-case-study", caseStudyId],
    queryFn: () => getSDCaseStudy(caseStudyId!),
    enabled: !!caseStudyId,
  });

  const discussMutation = useMutation({
    mutationFn: async () => {
      const convo = await createConversation("system_design");
      navigate(`/system-design/${convo.id}`, {
        state: { diagram: study?.reference_diagram ?? null },
      });
    },
  });

  if (isLoading) {
    return (
      <Page>
        <Skeleton height={36} width={180} radius="md" mb="lg" />
        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
          <Box>
            <Skeleton height={120} radius="lg" mb="lg" />
            <Skeleton height={200} radius="lg" />
          </Box>
          <Box>
            <Skeleton height={200} radius="lg" mb="lg" />
            <Skeleton height={120} radius="lg" />
          </Box>
        </SimpleGrid>
      </Page>
    );
  }

  if (isError || !study) {
    return (
      <Page>
        <Alert color="red">Case study not found.</Alert>
        <Button mt="md" variant="light" onClick={() => navigate("/system-design/case-studies")}>
          Back to case studies
        </Button>
      </Page>
    );
  }

  return (
    <Page>
      <Button variant="subtle" color="gray" leftSection={<FaArrowLeft size={14} />} onClick={() => navigate("/system-design/case-studies")}>
        All case studies
      </Button>

      <Group mt="sm" mb="lg" justify="space-between" align="flex-start" wrap="wrap">
        <Box style={{ maxWidth: 720 }}>
          <Group gap="sm" mb={4}>
            <Title order={3}>{study.title}</Title>
            <Badge variant="light" color={difficultyColor(study.difficulty)}>
              {study.difficulty}
            </Badge>
          </Group>
          <Group gap={4}>
            {study.topics.map((t) => (
              <Badge key={t} size="xs" variant="filled" color="gray">
                {t}
              </Badge>
            ))}
          </Group>
        </Box>
        <Button
          color="violet"
          variant="light"
          leftSection={<FaComments size={12} />}
          loading={discussMutation.isPending}
          onClick={() => discussMutation.mutate()}
        >
          Discuss in practice room
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg" className="app-stagger">
        <Stack gap="lg">
          <Card withBorder p="lg">
            <Text fw={600} size="sm" mb="xs">
              Overview
            </Text>
            <div style={{ fontSize: 13 }} className="md-content">
              <ReactMarkdown>{study.overview}</ReactMarkdown>
            </div>
          </Card>

          <Card withBorder p="lg">
            <Text fw={600} size="sm" mb="xs">
              Functional Requirements
            </Text>
            <Stack gap={4}>
              {study.functional_requirements.map((r, i) => (
                <Text key={i} size="sm">
                  • {r}
                </Text>
              ))}
            </Stack>
            <Divider my="md" />
            <Text fw={600} size="sm" mb="xs">
              Non-Functional Requirements
            </Text>
            <Stack gap={4}>
              {study.non_functional_requirements.map((r, i) => (
                <Text key={i} size="sm">
                  • {r}
                </Text>
              ))}
            </Stack>
          </Card>

          <Card withBorder p="lg">
            <Text fw={600} size="sm" mb="xs">
              Capacity Estimates
            </Text>
            <SimpleGrid cols={2} spacing="sm">
              {Object.entries(study.capacity).map(([k, v]) => (
                <Box key={k}>
                  <Text size="xs" c="dimmed">
                    {k}
                  </Text>
                  <Text size="sm" fw={600}>
                    {v}
                  </Text>
                </Box>
              ))}
            </SimpleGrid>
          </Card>
        </Stack>

        <Stack gap="lg">
          <Card withBorder p="lg">
            <Text fw={600} size="sm" mb="xs">
              Key Components
            </Text>
            <Stack gap="sm">
              {study.key_components.map((c) => (
                <Box key={c.name}>
                  <Text size="sm" fw={600}>
                    {c.name}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {c.responsibility}
                  </Text>
                </Box>
              ))}
            </Stack>
          </Card>

          <Card withBorder p="lg">
            <Text fw={600} size="sm" mb="xs">
              Tradeoffs
            </Text>
            <Stack gap={4}>
              {study.tradeoffs.map((t, i) => (
                <Text key={i} size="sm">
                  • {t}
                </Text>
              ))}
            </Stack>
          </Card>

          {study.reference_diagram && (
            <Card withBorder p="lg">
              <Group justify="space-between" mb="xs">
                <Text fw={600} size="sm">
                  Reference Architecture
                </Text>
                <Button
                  size="compact-xs"
                  variant="subtle"
                  leftSection={<FaProjectDiagram size={12} />}
                  loading={discussMutation.isPending}
                  onClick={() => discussMutation.mutate()}
                >
                  Load into whiteboard
                </Button>
              </Group>
              <SystemDesignDiagram diagram={study.reference_diagram} />
            </Card>
          )}
        </Stack>
      </SimpleGrid>
    </Page>
  );
};
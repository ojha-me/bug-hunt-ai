import {
  Box,
  Text,
  Button,
  Stack,
  Group,
  Badge,
  Card,
  Loader,
  Alert,
  Divider,
  Title,
  SimpleGrid,
} from "@mantine/core";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { FaArrowLeft, FaProjectDiagram, FaComments } from "react-icons/fa";
import { getSDCaseStudy } from "../api/systemDesign";
import { createConversation } from "../api/conversation";
import { SystemDesignDiagram } from "./SystemDesignDiagram";
import type { SDCaseStudyDifficulty } from "../types/system_design/api_types";

const difficultyColor = (d: SDCaseStudyDifficulty) =>
  d === "easy" ? "green" : d === "medium" ? "yellow" : "red";

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
      <Box p="xl" ta="center">
        <Loader />
      </Box>
    );
  }

  if (isError || !study) {
    return (
      <Box p="xl">
        <Alert color="red">Case study not found.</Alert>
        <Button mt="md" variant="light" onClick={() => navigate("/system-design/case-studies")}>
          Back to case studies
        </Button>
      </Box>
    );
  }

  return (
    <Box p="md" style={{ minHeight: "100vh", overflowY: "auto", background: "#f9f9f9" }}>
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

      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
        <Stack gap="lg">
          <Card withBorder radius="md" p="lg">
            <Text fw={600} size="sm" mb="xs">
              Overview
            </Text>
            <div style={{ fontSize: 13 }}>
              <ReactMarkdown>{study.overview}</ReactMarkdown>
            </div>
          </Card>

          <Card withBorder radius="md" p="lg">
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

          <Card withBorder radius="md" p="lg">
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
          <Card withBorder radius="md" p="lg">
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

          <Card withBorder radius="md" p="lg">
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
            <Card withBorder radius="md" p="lg">
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
    </Box>
  );
};
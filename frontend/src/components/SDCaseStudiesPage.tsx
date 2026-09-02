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
} from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FaProjectDiagram, FaArrowRight } from "react-icons/fa";
import { getSDCaseStudies } from "../api/systemDesign";
import type { SDCaseStudyDifficulty } from "../types/system_design/api_types";

const difficultyColor = (d: SDCaseStudyDifficulty) =>
  d === "easy" ? "green" : d === "medium" ? "yellow" : "red";

export const SDCaseStudiesPage = () => {
  const navigate = useNavigate();
  const { data: caseStudies, isLoading } = useQuery({
    queryKey: ["sd-case-studies"],
    queryFn: getSDCaseStudies,
  });

  return (
    <Box p="md" style={{ height: "100vh", overflowY: "auto", background: "#f9f9f9" }}>
      <Group mb="lg">
        <Badge size="lg" variant="light" color="violet">
          <FaProjectDiagram size={12} style={{ marginRight: 4 }} />
          System Design
        </Badge>
        <Text size="xl" fw={700}>
          Case Studies
        </Text>
      </Group>

      <Text size="sm" c="dimmed" mb="lg">
        Canonical problems with reference architectures. Read the statement, study the diagram, then
        open a practice room to discuss it with the AI interviewer.
      </Text>

      {isLoading ? (
        <Box p="xl" ta="center">
          <Loader />
        </Box>
      ) : caseStudies?.length ? (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
          {caseStudies.map((cs) => (
            <Card key={cs.id} withBorder radius="md" p="lg" style={{ display: "flex", flexDirection: "column" }}>
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
                variant="light"
                color="violet"
                leftSection={<FaArrowRight size={12} />}
                onClick={() => navigate(`/system-design/case-studies/${cs.id}`)}
              >
                Study
              </Button>
            </Card>
          ))}
        </SimpleGrid>
      ) : (
        <Stack gap="sm" pt="xl" ta="center">
          <Text c="dimmed">No case studies available yet.</Text>
        </Stack>
      )}
    </Box>
  );
};
import { Text, Button, Group, Badge, Card, SimpleGrid } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FaProjectDiagram, FaArrowRight } from "react-icons/fa";
import { getSDCaseStudies } from "../api/systemDesign";
import { Page, PageHeader, GridSkeleton, EmptyState, difficultyColor } from "./ui";

export const SDCaseStudiesPage = () => {
  const navigate = useNavigate();
  const { data: caseStudies, isLoading } = useQuery({
    queryKey: ["sd-case-studies"],
    queryFn: getSDCaseStudies,
  });

  return (
    <Page>
      <PageHeader
        icon={<FaProjectDiagram size={14} />}
        iconColor="violet"
        title="Case Studies"
        subtitle="Canonical problems with reference architectures. Read the statement, study the diagram, then open a practice room to discuss it with the AI interviewer."
      />

      {isLoading ? (
        <GridSkeleton cards={6} />
      ) : caseStudies?.length ? (
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
        <EmptyState
          icon={<FaProjectDiagram />}
          iconColor="violet"
          title="No case studies available yet."
        />
      )}
    </Page>
  );
};
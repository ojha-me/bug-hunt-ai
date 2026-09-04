import { Text, Card, Group, Badge, Box, SimpleGrid, Stack, List } from "@mantine/core";
import { FaComments, FaLightbulb } from "react-icons/fa";
import { Page, PageHeader } from "./ui";
import { STAR, GENERAL_TIPS, BEHAVIORAL_CATEGORIES } from "../data/behavioralQuestions";

export const BehavioralPrepPage = () => {
  return (
    <Page>
      <PageHeader
        icon={<FaComments size={14} />}
        iconColor="grape"
        title="Behavioral Prep"
        subtitle="Half of most remote interviews is behavioral. Prepare a handful of strong stories and a structure to tell them — then these questions become easy."
      />

      {/* STAR framework */}
      <Card withBorder radius="md" p="lg" mb="lg">
        <Text fw={600} mb="sm">Answer with STAR</Text>
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
          {STAR.map((s) => (
            <Box key={s.letter}>
              <Group gap={8} mb={4}>
                <Badge size="lg" variant="filled" color="grape" radius="sm">{s.letter}</Badge>
                <Text fw={600} size="sm">{s.label}</Text>
              </Group>
              <Text size="xs" c="dimmed" style={{ lineHeight: 1.5 }}>{s.detail}</Text>
            </Box>
          ))}
        </SimpleGrid>
      </Card>

      {/* General tips */}
      <Card withBorder radius="md" p="lg" mb="xl" style={{ background: "var(--app-sunken)" }}>
        <Group gap={8} mb="sm">
          <FaLightbulb style={{ color: "var(--mantine-color-yellow-6)" }} />
          <Text fw={600} size="sm">How to prepare</Text>
        </Group>
        <List spacing={6} size="sm" c="dimmed">
          {GENERAL_TIPS.map((t, i) => (
            <List.Item key={i}>{t}</List.Item>
          ))}
        </List>
      </Card>

      {/* Question bank by category */}
      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg" className="app-stagger">
        {BEHAVIORAL_CATEGORIES.map((cat) => (
          <Card key={cat.name} withBorder radius="md" p="lg" className="app-hover-lift">
            <Text fw={650} size="md">{cat.name}</Text>
            <Text size="xs" c="dimmed" mt={2} mb="sm">
              <b>What they're assessing:</b> {cat.assesses}
            </Text>
            <Stack gap={6} mb="md">
              {cat.questions.map((q, i) => (
                <Text key={i} size="sm" style={{ lineHeight: 1.4 }}>
                  • {q}
                </Text>
              ))}
            </Stack>
            {cat.tip && (
              <Box p="sm" style={{ borderRadius: 8, background: "var(--mantine-color-grape-light)" }}>
                <Text size="xs" style={{ lineHeight: 1.5 }}>
                  <b>Tip:</b> {cat.tip}
                </Text>
              </Box>
            )}
          </Card>
        ))}
      </SimpleGrid>
    </Page>
  );
};

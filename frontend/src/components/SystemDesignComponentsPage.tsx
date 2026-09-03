import { Text, Card, Badge, Group, Box, SimpleGrid, Stack } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { FaCubes, FaArrowRight } from "react-icons/fa";
import { Page, PageHeader } from "./ui";
import { KIND_META } from "./SystemDesignNodes";
import { COMPONENT_CARDS, CARD_CATEGORIES, type ComponentCard } from "../data/componentCards";

export const KindChip = ({ kind, size = 34 }: { kind: ComponentCard["kind"]; size?: number }) => {
  const meta = KIND_META[kind];
  return (
    <Box
      style={{
        width: size,
        height: size,
        borderRadius: 9,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: meta.color,
        background: `${meta.color}1f`,
        border: `1.5px solid ${meta.color}`,
        fontSize: size * 0.45,
        flexShrink: 0,
      }}
    >
      {meta.icon}
    </Box>
  );
};

export const SystemDesignComponentsPage = () => {
  const navigate = useNavigate();

  return (
    <Page>
      <PageHeader
        icon={<FaCubes size={14} />}
        iconColor="violet"
        title="Components"
        subtitle="The building blocks of every system design. Don't just memorize what each one is — learn to reason about when and why you'd reach for it, then test yourself and talk it through with the tutor."
      />

      <Stack gap="xl">
        {CARD_CATEGORIES.map((category) => {
          const cards = COMPONENT_CARDS.filter((c) => c.category === category);
          if (!cards.length) return null;
          return (
            <Box key={category}>
              <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="sm" style={{ letterSpacing: 0.6 }}>
                {category}
              </Text>
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md" className="app-stagger">
                {cards.map((card) => (
                  <Card
                    key={card.kind}
                    withBorder
                    p="md"
                    className="app-hover-lift"
                    style={{ cursor: "pointer", display: "flex", flexDirection: "column" }}
                    onClick={() => navigate(`/system-design/components/${card.kind}`)}
                  >
                    <Group gap="sm" wrap="nowrap" mb={8} justify="space-between">
                      <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
                        <KindChip kind={card.kind} />
                        <Text fw={600} truncate>
                          {card.name}
                        </Text>
                      </Group>
                      <Badge size="xs" variant={card.lesson ? "filled" : "light"} color={card.lesson ? "violet" : "gray"}>
                        {card.lesson ? "Lesson" : "Reference"}
                      </Badge>
                    </Group>
                    <Text size="sm" c="dimmed" style={{ flex: 1, lineHeight: 1.45 }}>
                      {card.tagline}
                    </Text>
                    <Group gap={4} mt="sm" justify="space-between" wrap="nowrap">
                      <Group gap={4} wrap="wrap" style={{ minWidth: 0 }}>
                        {card.examples.slice(0, 2).map((ex) => (
                          <Badge key={ex} size="xs" variant="light" color="gray">
                            {ex}
                          </Badge>
                        ))}
                      </Group>
                      <FaArrowRight size={12} style={{ color: "var(--mantine-color-dimmed)", flexShrink: 0 }} />
                    </Group>
                  </Card>
                ))}
              </SimpleGrid>
            </Box>
          );
        })}
      </Stack>
    </Page>
  );
};

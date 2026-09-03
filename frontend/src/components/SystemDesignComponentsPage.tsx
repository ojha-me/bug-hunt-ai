import { useState } from "react";
import { Text, Card, Badge, Group, Box, SimpleGrid, Modal, Stack, Divider } from "@mantine/core";
import { FaCubes, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import { Page, PageHeader } from "./ui";
import { KIND_META } from "./SystemDesignNodes";
import { COMPONENT_CARDS, CARD_CATEGORIES, type ComponentCard } from "../data/componentCards";

const KindChip = ({ kind, size = 34 }: { kind: ComponentCard["kind"]; size?: number }) => {
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

const DetailList = ({
  title,
  items,
  icon,
  color,
}: {
  title: string;
  items: string[];
  icon: React.ReactNode;
  color: string;
}) => (
  <Box>
    <Group gap={6} mb={6}>
      <Box style={{ color, display: "inline-flex", fontSize: 13 }}>{icon}</Box>
      <Text size="sm" fw={600}>
        {title}
      </Text>
    </Group>
    <Stack gap={4}>
      {items.map((item, i) => (
        <Text key={i} size="sm" c="dimmed" style={{ lineHeight: 1.4 }}>
          • {item}
        </Text>
      ))}
    </Stack>
  </Box>
);

export const SystemDesignComponentsPage = () => {
  const [selected, setSelected] = useState<ComponentCard | null>(null);

  return (
    <Page>
      <PageHeader
        icon={<FaCubes size={14} />}
        iconColor="violet"
        title="Components"
        subtitle="The building blocks of every system design. Learn what each piece is for, its consistency model, and how it scales — then pick the right one and defend the trade-off."
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
                    onClick={() => setSelected(card)}
                  >
                    <Group gap="sm" wrap="nowrap" mb={8}>
                      <KindChip kind={card.kind} />
                      <Text fw={600}>{card.name}</Text>
                    </Group>
                    <Text size="sm" c="dimmed" style={{ flex: 1, lineHeight: 1.45 }}>
                      {card.tagline}
                    </Text>
                    <Group gap={4} mt="sm" wrap="wrap">
                      {card.examples.slice(0, 3).map((ex) => (
                        <Badge key={ex} size="xs" variant="light" color="gray">
                          {ex}
                        </Badge>
                      ))}
                    </Group>
                  </Card>
                ))}
              </SimpleGrid>
            </Box>
          );
        })}
      </Stack>

      <Modal
        opened={!!selected}
        onClose={() => setSelected(null)}
        size="lg"
        radius="md"
        title={
          selected && (
            <Group gap="sm">
              <KindChip kind={selected.kind} size={38} />
              <Box>
                <Text fw={700}>{selected.name}</Text>
                <Text size="xs" c="dimmed">
                  {selected.category}
                </Text>
              </Box>
            </Group>
          )
        }
      >
        {selected && (
          <Stack gap="md">
            <Text size="sm" style={{ lineHeight: 1.5 }}>
              {selected.tagline}
            </Text>

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <DetailList
                title="When to use"
                items={selected.whenToUse}
                icon={<FaCheckCircle />}
                color="var(--mantine-color-teal-6)"
              />
              <DetailList
                title="Watch out for"
                items={selected.watchOut}
                icon={<FaExclamationTriangle />}
                color="var(--mantine-color-orange-6)"
              />
            </SimpleGrid>

            <Divider />

            <Group align="flex-start" gap="xl" wrap="wrap">
              <Box style={{ flex: 1, minWidth: 200 }}>
                <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb={4} style={{ letterSpacing: 0.5 }}>
                  Consistency
                </Text>
                <Text size="sm" c="dimmed" style={{ lineHeight: 1.45 }}>
                  {selected.consistency}
                </Text>
              </Box>
              <Box style={{ flex: 1, minWidth: 200 }}>
                <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb={4} style={{ letterSpacing: 0.5 }}>
                  Scaling
                </Text>
                <Text size="sm" c="dimmed" style={{ lineHeight: 1.45 }}>
                  {selected.scaling}
                </Text>
              </Box>
            </Group>

            <Box>
              <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb={6} style={{ letterSpacing: 0.5 }}>
                Real-world examples
              </Text>
              <Group gap={6} wrap="wrap">
                {selected.examples.map((ex) => (
                  <Badge key={ex} variant="light" color="violet">
                    {ex}
                  </Badge>
                ))}
              </Group>
            </Box>
          </Stack>
        )}
      </Modal>
    </Page>
  );
};

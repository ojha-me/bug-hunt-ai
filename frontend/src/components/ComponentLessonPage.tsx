import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import {
  Text,
  Box,
  Group,
  Stack,
  Card,
  Badge,
  Button,
  Divider,
  Alert,
  UnstyledButton,
  SimpleGrid,
  Anchor,
} from "@mantine/core";
import {
  FaArrowLeft,
  FaCheck,
  FaTimes,
  FaCheckCircle,
  FaExclamationTriangle,
  FaComments,
  FaLightbulb,
} from "react-icons/fa";
import { Page, EmptyState } from "./ui";
import { KindChip } from "./SystemDesignComponentsPage";
import { createConversation } from "../api/conversation";
import { COMPONENT_CARDS, type Drill } from "../data/componentCards";

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <Box>
    <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb={6} style={{ letterSpacing: 0.6 }}>
      {label}
    </Text>
    <Box className="md-content" style={{ lineHeight: 1.6 }}>
      {children}
    </Box>
  </Box>
);

const DrillItem = ({ drill, index }: { drill: Drill; index: number }) => {
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;
  const correct = picked === drill.answerIndex;

  return (
    <Card withBorder p="md" radius="md">
      <Group gap={8} mb="xs">
        <Badge size="sm" variant="light" color="violet">
          Scenario {index + 1}
        </Badge>
      </Group>
      <Text size="sm" fw={500} mb="md" style={{ lineHeight: 1.5 }}>
        {drill.scenario}
      </Text>
      <Stack gap={8}>
        {drill.options.map((opt, i) => {
          const isAnswer = i === drill.answerIndex;
          const isPicked = i === picked;
          const showCorrect = answered && isAnswer;
          const showWrong = answered && isPicked && !isAnswer;
          const accent = showCorrect
            ? "var(--mantine-color-teal-6)"
            : showWrong
            ? "var(--mantine-color-red-6)"
            : "var(--app-line)";
          return (
            <UnstyledButton
              key={i}
              disabled={answered}
              onClick={() => setPicked(i)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 8,
                border: `1.5px solid ${accent}`,
                background: showCorrect
                  ? "var(--mantine-color-teal-light)"
                  : showWrong
                  ? "var(--mantine-color-red-light)"
                  : "var(--app-surface)",
                cursor: answered ? "default" : "pointer",
                opacity: answered && !isAnswer && !isPicked ? 0.6 : 1,
                transition: "border-color 120ms, background 120ms",
              }}
            >
              <Box
                style={{
                  width: 18,
                  height: 18,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: showCorrect
                    ? "var(--mantine-color-teal-6)"
                    : showWrong
                    ? "var(--mantine-color-red-6)"
                    : "var(--mantine-color-dimmed)",
                }}
              >
                {showCorrect ? <FaCheck size={14} /> : showWrong ? <FaTimes size={14} /> : <Box style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid currentColor" }} />}
              </Box>
              <Text size="sm">{opt}</Text>
            </UnstyledButton>
          );
        })}
      </Stack>
      {answered && (
        <Alert
          mt="md"
          variant="light"
          color={correct ? "teal" : "orange"}
          title={correct ? "Correct" : "Not quite"}
        >
          <Text size="sm" style={{ lineHeight: 1.5 }}>
            {drill.explanation}
          </Text>
        </Alert>
      )}
    </Card>
  );
};

export const ComponentLessonPage = () => {
  const { kind } = useParams<{ kind: string }>();
  const navigate = useNavigate();
  const card = COMPONENT_CARDS.find((c) => c.kind === kind);

  const tutorMutation = useMutation({
    mutationFn: () => createConversation("system_design"),
    onSuccess: (convo) => {
      navigate(`/system-design/${convo.id}`, {
        state: { prompt: card?.lesson?.tutorPrompt },
      });
    },
  });

  if (!card) {
    return (
      <Page>
        <EmptyState
          icon={<FaLightbulb />}
          iconColor="violet"
          title="Component not found."
          action={<Button variant="light" onClick={() => navigate("/system-design/components")}>Back to Components</Button>}
        />
      </Page>
    );
  }

  const { lesson } = card;

  return (
    <Page>
      <Anchor
        component="button"
        onClick={() => navigate("/system-design/components")}
        c="dimmed"
        mb="md"
        style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}
      >
        <FaArrowLeft size={11} /> Components
      </Anchor>

      <Group gap="md" mb="xs" wrap="nowrap">
        <KindChip kind={card.kind} size={44} />
        <Box>
          <Text size="xl" fw={700} lh={1.2}>
            {card.name}
          </Text>
          <Text size="xs" c="dimmed">
            {card.category}
          </Text>
        </Box>
      </Group>
      <Text size="sm" c="dimmed" mb="xl" style={{ maxWidth: 760, lineHeight: 1.5 }}>
        {card.tagline}
      </Text>

      <Box style={{ maxWidth: 820 }}>
        {lesson ? (
          <Stack gap="xl">
            <Section label="The problem">
              <ReactMarkdown>{lesson.problem}</ReactMarkdown>
            </Section>
            <Section label="Mental model">
              <ReactMarkdown>{lesson.mentalModel}</ReactMarkdown>
            </Section>
            <Section label="How it works">
              <ReactMarkdown>{lesson.howItWorks}</ReactMarkdown>
            </Section>
            <Section label="Why the trade-off exists">
              <ReactMarkdown>{lesson.why}</ReactMarkdown>
            </Section>

            <Box>
              <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="sm" style={{ letterSpacing: 0.6 }}>
                Common pitfalls
              </Text>
              <Stack gap="sm">
                {lesson.pitfalls.map((p) => (
                  <Card key={p.title} withBorder p="sm" radius="md">
                    <Group gap={8} mb={4} wrap="nowrap">
                      <Box style={{ color: "var(--mantine-color-orange-6)", display: "inline-flex", fontSize: 13, flexShrink: 0 }}>
                        <FaExclamationTriangle />
                      </Box>
                      <Text size="sm" fw={600}>
                        {p.title}
                      </Text>
                    </Group>
                    <Text size="sm" c="dimmed" style={{ lineHeight: 1.5 }}>
                      {p.detail}
                    </Text>
                  </Card>
                ))}
              </Stack>
            </Box>

            <Divider label="Test yourself" labelPosition="center" />

            <Stack gap="md">
              {lesson.drills.map((drill, i) => (
                <DrillItem key={i} drill={drill} index={i} />
              ))}
            </Stack>

            <Card withBorder radius="md" p="lg" style={{ background: "var(--app-sunken)" }}>
              <Group justify="space-between" wrap="wrap" gap="md">
                <Box style={{ flex: 1, minWidth: 220 }}>
                  <Text fw={600} mb={2}>
                    Go deeper with the tutor
                  </Text>
                  <Text size="sm" c="dimmed" style={{ lineHeight: 1.5 }}>
                    Open a live session where the AI interviewer walks you through {card.name.toLowerCase()} with scenarios, then probes and corrects your reasoning.
                  </Text>
                </Box>
                <Button
                  leftSection={<FaComments size={14} />}
                  color="violet"
                  loading={tutorMutation.isPending}
                  onClick={() => tutorMutation.mutate()}
                >
                  Discuss with the tutor
                </Button>
              </Group>
            </Card>
          </Stack>
        ) : (
          <Alert variant="light" color="gray" mb="xl">
            A full guided lesson for {card.name} is coming soon. Here's the quick reference for now.
          </Alert>
        )}

        <Divider my="xl" label="Quick reference" labelPosition="center" />

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg" mb="lg">
          <Box>
            <Group gap={6} mb={6}>
              <Box style={{ color: "var(--mantine-color-teal-6)", display: "inline-flex", fontSize: 13 }}>
                <FaCheckCircle />
              </Box>
              <Text size="sm" fw={600}>
                When to use
              </Text>
            </Group>
            <Stack gap={4}>
              {card.whenToUse.map((x, i) => (
                <Text key={i} size="sm" c="dimmed" style={{ lineHeight: 1.4 }}>
                  • {x}
                </Text>
              ))}
            </Stack>
          </Box>
          <Box>
            <Group gap={6} mb={6}>
              <Box style={{ color: "var(--mantine-color-orange-6)", display: "inline-flex", fontSize: 13 }}>
                <FaExclamationTriangle />
              </Box>
              <Text size="sm" fw={600}>
                Watch out for
              </Text>
            </Group>
            <Stack gap={4}>
              {card.watchOut.map((x, i) => (
                <Text key={i} size="sm" c="dimmed" style={{ lineHeight: 1.4 }}>
                  • {x}
                </Text>
              ))}
            </Stack>
          </Box>
        </SimpleGrid>

        <Group align="flex-start" gap="xl" wrap="wrap" mb="lg">
          <Box style={{ flex: 1, minWidth: 200 }}>
            <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb={4} style={{ letterSpacing: 0.5 }}>
              Consistency
            </Text>
            <Text size="sm" c="dimmed" style={{ lineHeight: 1.45 }}>
              {card.consistency}
            </Text>
          </Box>
          <Box style={{ flex: 1, minWidth: 200 }}>
            <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb={4} style={{ letterSpacing: 0.5 }}>
              Scaling
            </Text>
            <Text size="sm" c="dimmed" style={{ lineHeight: 1.45 }}>
              {card.scaling}
            </Text>
          </Box>
        </Group>

        <Box>
          <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb={6} style={{ letterSpacing: 0.5 }}>
            Real-world examples
          </Text>
          <Group gap={6} wrap="wrap">
            {card.examples.map((ex) => (
              <Badge key={ex} variant="light" color="violet">
                {ex}
              </Badge>
            ))}
          </Group>
        </Box>
      </Box>
    </Page>
  );
};

import { useState } from "react";
import { Card, Text, Stack, UnstyledButton, Box, Alert, Badge, Group, Button } from "@mantine/core";
import { FaCheck, FaTimes, FaEye } from "react-icons/fa";
import type { PatternDrill, Walkthrough } from "../data/patternInteractive";

export const DrillCard = ({ drill, index }: { drill: PatternDrill; index: number }) => {
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;
  const correct = picked === drill.answerIndex;

  return (
    <Card withBorder p="md" radius="md">
      <Badge size="sm" variant="light" color="teal" mb="xs">Q{index + 1}</Badge>
      <Text size="sm" fw={500} mb="md" style={{ lineHeight: 1.5 }}>{drill.question}</Text>
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
              onClick={() => !answered && setPicked(i)}
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
              }}
            >
              <Box style={{ width: 18, height: 18, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: accent }}>
                {showCorrect ? <FaCheck size={13} /> : showWrong ? <FaTimes size={13} /> : (
                  <Box style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid currentColor" }} />
                )}
              </Box>
              <Text size="sm">{opt}</Text>
            </UnstyledButton>
          );
        })}
      </Stack>
      {answered && (
        <Alert mt="md" variant="light" color={correct ? "teal" : "orange"} title={correct ? "Correct" : "Not quite"}>
          <Text size="sm" style={{ lineHeight: 1.5 }}>{drill.explanation}</Text>
        </Alert>
      )}
    </Card>
  );
};

const WalkStep = ({ prompt, reveal, n }: { prompt: string; reveal: string; n: number }) => {
  const [open, setOpen] = useState(false);
  return (
    <Box>
      <Group gap="sm" wrap="nowrap" align="flex-start">
        <Badge size="sm" variant="light" color="grape" style={{ flexShrink: 0, marginTop: 2 }}>{n}</Badge>
        <Box style={{ flex: 1 }}>
          <Text size="sm" style={{ lineHeight: 1.5 }}>{prompt}</Text>
          {open ? (
            <Text size="sm" mt={6} c="dimmed" style={{ lineHeight: 1.5, borderLeft: "2px solid var(--mantine-color-grape-4)", paddingLeft: 10 }}>
              {reveal}
            </Text>
          ) : (
            <Button size="compact-xs" variant="subtle" color="grape" mt={6} leftSection={<FaEye size={10} />} onClick={() => setOpen(true)}>
              Reveal
            </Button>
          )}
        </Box>
      </Group>
    </Box>
  );
};

export const WalkthroughCard = ({ walkthrough }: { walkthrough: Walkthrough }) => (
  <Card withBorder p="lg" radius="md">
    <Text size="sm" fw={600} mb="md">{walkthrough.problem}</Text>
    <Stack gap="md">
      {walkthrough.steps.map((s, i) => (
        <WalkStep key={i} n={i + 1} prompt={s.prompt} reveal={s.reveal} />
      ))}
    </Stack>
    <Alert mt="md" variant="light" color="teal">
      <Text size="sm" style={{ lineHeight: 1.5 }}>{walkthrough.outcome}</Text>
    </Alert>
  </Card>
);

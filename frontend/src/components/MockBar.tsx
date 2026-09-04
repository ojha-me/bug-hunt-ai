import { Group, Text, Badge, Button, Box } from "@mantine/core";
import { FaStopwatch, FaForward, FaStop, FaLocationArrow } from "react-icons/fa";
import { formatMs } from "../lib/mock";

interface Props {
  remainingMs: number;
  index: number;
  total: number;
  isCurrent: boolean;
  onSkip: () => void;
  onEnd: () => void;
  onGoCurrent: () => void;
}

export const MockBar = ({ remainingMs, index, total, isCurrent, onSkip, onEnd, onGoCurrent }: Props) => {
  const low = remainingMs <= 2 * 60_000;
  return (
    <Box
      mb="md"
      p="xs"
      style={{
        borderRadius: "var(--mantine-radius-md)",
        border: `1px solid ${low ? "var(--mantine-color-red-4)" : "var(--app-line)"}`,
        background: low ? "var(--mantine-color-red-light)" : "var(--app-sunken)",
      }}
    >
      <Group justify="space-between" wrap="wrap" gap="sm">
        <Group gap="sm" wrap="nowrap">
          <Badge color="violet" variant="filled">
            Mock Interview
          </Badge>
          <Text size="sm" fw={600}>
            Problem {Math.min(index + 1, total)} / {total}
          </Text>
          {!isCurrent && (
            <Badge color="orange" variant="light">
              viewing another problem
            </Badge>
          )}
        </Group>
        <Group gap="sm" wrap="nowrap">
          <Group gap={6} wrap="nowrap">
            <FaStopwatch size={13} style={{ color: low ? "var(--mantine-color-red-7)" : "var(--mantine-color-dimmed)" }} />
            <Text fw={700} c={low ? "red" : undefined} style={{ fontVariantNumeric: "tabular-nums", minWidth: 48 }}>
              {formatMs(remainingMs)}
            </Text>
          </Group>
          {isCurrent ? (
            <Button size="compact-sm" variant="light" color="gray" leftSection={<FaForward size={11} />} onClick={onSkip}>
              Skip
            </Button>
          ) : (
            <Button size="compact-sm" variant="light" color="violet" leftSection={<FaLocationArrow size={11} />} onClick={onGoCurrent}>
              Current problem
            </Button>
          )}
          <Button size="compact-sm" variant="subtle" color="red" leftSection={<FaStop size={11} />} onClick={onEnd}>
            End
          </Button>
        </Group>
      </Group>
    </Box>
  );
};

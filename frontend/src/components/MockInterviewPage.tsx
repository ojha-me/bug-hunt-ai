import { useMemo, useState } from "react";
import { Text, Button, Group, Badge, Card, Stack, Box, SegmentedControl, Select, Divider } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FaStopwatch, FaPlay, FaCheckCircle, FaForward, FaRedo } from "react-icons/fa";
import { getProblems, getProblemLists } from "../api/challenges";
import { Page, PageHeader } from "./ui";
import {
  getMockSession,
  getMockResult,
  saveMockSession,
  clearMockSession,
  saveMockResult,
  clearMockResult,
  buildMockSession,
  shuffle,
  formatMs,
  type MockSession,
} from "../lib/mock";

export const MockInterviewPage = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<MockSession | null>(() => getMockSession());
  const [result, setResult] = useState<MockSession | null>(() => getMockResult());

  const { data: problems } = useQuery({ queryKey: ["coding-problems"], queryFn: getProblems });
  const { data: lists } = useQuery({ queryKey: ["problem-lists"], queryFn: getProblemLists });

  const [duration, setDuration] = useState("45");
  const [count, setCount] = useState("5");
  const [difficulty, setDifficulty] = useState("all");
  const [listSlug, setListSlug] = useState("all");

  const pool = useMemo(() => {
    let p = problems ?? [];
    if (listSlug !== "all") {
      const l = lists?.find((x) => x.slug === listSlug);
      const set = new Set(l?.problem_slugs ?? []);
      p = p.filter((x) => set.has(x.slug));
    }
    if (difficulty !== "all") p = p.filter((x) => x.difficulty === difficulty);
    return p;
  }, [problems, lists, listSlug, difficulty]);

  const start = () => {
    const picked = shuffle(pool)
      .slice(0, Number(count))
      .map((p) => ({ id: p.id, title: p.title }));
    if (!picked.length) return;
    const s = buildMockSession(picked, Number(duration), Date.now());
    saveMockSession(s);
    navigate(`/challenges/${s.problemIds[0]}`);
  };

  const endActive = () => {
    if (!session) return;
    const finished = { ...session, endedAt: Date.now() };
    saveMockResult(finished);
    clearMockSession();
    setSession(null);
    setResult(finished);
  };

  // ---- Active session ----
  if (session) {
    return (
      <Page>
        <PageHeader icon={<FaStopwatch size={14} />} iconColor="violet" title="Mock Interview" subtitle="A session is in progress." />
        <Card withBorder p="lg" radius="md" style={{ maxWidth: 520 }}>
          <Text fw={600} mb="xs">
            You're on problem {Math.min(session.index + 1, session.problemIds.length)} of {session.problemIds.length}.
          </Text>
          <Text size="sm" c="dimmed" mb="md">
            Jump back into the current problem, or end the session to see your summary.
          </Text>
          <Group>
            <Button
              color="violet"
              leftSection={<FaPlay size={12} />}
              onClick={() => navigate(`/challenges/${session.problemIds[session.index]}`)}
            >
              Resume
            </Button>
            <Button variant="light" color="red" onClick={endActive}>
              End & see summary
            </Button>
          </Group>
        </Card>
      </Page>
    );
  }

  // ---- Summary of the last finished session ----
  if (result) {
    const solved = result.problemIds.filter((id) => result.results[id] === "solved").length;
    const skipped = result.problemIds.filter((id) => result.results[id] === "skipped").length;
    const elapsed = (result.endedAt ?? result.startedAt) - result.startedAt;
    return (
      <Page>
        <PageHeader icon={<FaCheckCircle size={14} />} iconColor="teal" title="Mock Interview — Summary" subtitle="How that session went." />
        <Group mb="lg" gap="md">
          <Card withBorder p="md" radius="md">
            <Text size="xs" c="dimmed">Solved</Text>
            <Text size="xl" fw={700} c="teal">{solved}/{result.problemIds.length}</Text>
          </Card>
          <Card withBorder p="md" radius="md">
            <Text size="xs" c="dimmed">Skipped</Text>
            <Text size="xl" fw={700}>{skipped}</Text>
          </Card>
          <Card withBorder p="md" radius="md">
            <Text size="xs" c="dimmed">Time used</Text>
            <Text size="xl" fw={700}>{formatMs(elapsed)}</Text>
          </Card>
        </Group>

        <Stack gap="xs" mb="lg" style={{ maxWidth: 640 }}>
          {result.problemIds.map((id, i) => {
            const outcome = result.results[id];
            return (
              <Card key={id} withBorder p="sm" radius="sm">
                <Group justify="space-between">
                  <Group gap="sm">
                    <Text size="sm" c="dimmed" w={22}>{i + 1}.</Text>
                    <Text size="sm" fw={500}>{result.titles[id] ?? "Problem"}</Text>
                  </Group>
                  <Group gap="sm">
                    <Badge size="sm" color={outcome === "solved" ? "teal" : outcome === "skipped" ? "orange" : "gray"} variant="light">
                      {outcome ?? "not reached"}
                    </Badge>
                    <Button size="compact-xs" variant="subtle" onClick={() => navigate(`/challenges/${id}`)}>
                      Open
                    </Button>
                  </Group>
                </Group>
              </Card>
            );
          })}
        </Stack>

        <Group>
          <Button leftSection={<FaRedo size={12} />} onClick={() => { clearMockResult(); setResult(null); }}>
            New mock
          </Button>
          <Button variant="light" onClick={() => { clearMockResult(); navigate("/challenges"); }}>
            Back to library
          </Button>
        </Group>
      </Page>
    );
  }

  // ---- Setup ----
  return (
    <Page>
      <PageHeader
        icon={<FaStopwatch size={14} />}
        iconColor="violet"
        title="Mock Interview"
        subtitle="Simulate the real thing: a countdown, a set of random problems, and no hints. Solve or skip; get a summary at the end."
      />
      <Card withBorder p="lg" radius="md" style={{ maxWidth: 560 }}>
        <Stack gap="md">
          <Box>
            <Text size="sm" fw={600} mb={6}>Total time</Text>
            <SegmentedControl
              value={duration}
              onChange={setDuration}
              data={[
                { label: "30 min", value: "30" },
                { label: "45 min", value: "45" },
                { label: "60 min", value: "60" },
                { label: "90 min", value: "90" },
              ]}
            />
          </Box>
          <Box>
            <Text size="sm" fw={600} mb={6}>Problems</Text>
            <SegmentedControl
              value={count}
              onChange={setCount}
              data={[
                { label: "1", value: "1" },
                { label: "3", value: "3" },
                { label: "5", value: "5" },
                { label: "8", value: "8" },
              ]}
            />
          </Box>
          <Box>
            <Text size="sm" fw={600} mb={6}>Difficulty</Text>
            <SegmentedControl
              value={difficulty}
              onChange={setDifficulty}
              data={[
                { label: "Any", value: "all" },
                { label: "Easy", value: "easy" },
                { label: "Medium", value: "medium" },
                { label: "Hard", value: "hard" },
              ]}
            />
          </Box>
          <Select
            label="From list (optional)"
            value={listSlug}
            onChange={(v) => setListSlug(v ?? "all")}
            allowDeselect={false}
            data={[
              { label: "Any problem", value: "all" },
              ...(lists ?? []).map((l) => ({ label: `${l.name} (${l.count})`, value: l.slug })),
            ]}
          />

          <Divider />
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              {pool.length} problem{pool.length === 1 ? "" : "s"} available · picking {Math.min(Number(count), pool.length)}
            </Text>
            <Button
              color="violet"
              leftSection={<FaForward size={12} />}
              onClick={start}
              disabled={pool.length === 0}
            >
              Start mock
            </Button>
          </Group>
        </Stack>
      </Card>
    </Page>
  );
};

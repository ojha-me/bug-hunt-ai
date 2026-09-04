// Client-side mock-interview session, persisted in localStorage so it survives
// navigation and refresh. No backend needed for v1.

export type MockOutcome = "solved" | "skipped";

export interface MockSession {
  problemIds: string[];
  titles: Record<string, string>;
  index: number;
  endsAt: number; // epoch ms when the session expires
  durationMin: number;
  results: Record<string, MockOutcome>;
  startedAt: number;
  endedAt?: number;
}

const SESSION_KEY = "mock-session";
const RESULT_KEY = "mock-result";

const read = <T>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

export const getMockSession = () => read<MockSession>(SESSION_KEY);
export const saveMockSession = (s: MockSession) => localStorage.setItem(SESSION_KEY, JSON.stringify(s));
export const clearMockSession = () => localStorage.removeItem(SESSION_KEY);

export const getMockResult = () => read<MockSession>(RESULT_KEY);
export const saveMockResult = (s: MockSession) => localStorage.setItem(RESULT_KEY, JSON.stringify(s));
export const clearMockResult = () => localStorage.removeItem(RESULT_KEY);

export const buildMockSession = (
  problems: { id: string; title: string }[],
  durationMin: number,
  now: number
): MockSession => ({
  problemIds: problems.map((p) => p.id),
  titles: Object.fromEntries(problems.map((p) => [p.id, p.title])),
  index: 0,
  endsAt: now + durationMin * 60_000,
  durationMin,
  results: {},
  startedAt: now,
});

export const formatMs = (ms: number): string => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

// Fisher–Yates shuffle (returns a new array).
export const shuffle = <T>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

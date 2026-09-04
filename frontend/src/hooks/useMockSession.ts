import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getMockSession,
  saveMockSession,
  clearMockSession,
  saveMockResult,
  type MockSession,
} from "../lib/mock";

/**
 * Drives the active mock-interview session: ticks the countdown, advances
 * through problems on solve/skip, and finishes (to the summary) when the timer
 * runs out or all problems are exhausted.
 */
export const useMockSession = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<MockSession | null>(() => getMockSession());
  const [remainingMs, setRemainingMs] = useState<number>(() => {
    const s = getMockSession();
    return s ? Math.max(0, s.endsAt - Date.now()) : 0;
  });
  const finishedRef = useRef(false);

  const finish = useCallback(
    (s: MockSession) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      saveMockResult({ ...s, endedAt: Date.now() });
      clearMockSession();
      setSession(null);
      navigate("/mock");
    },
    [navigate]
  );

  useEffect(() => {
    if (!session) return;
    finishedRef.current = false;
    const tick = () => {
      const rem = Math.max(0, session.endsAt - Date.now());
      setRemainingMs(rem);
      if (rem <= 0) finish(session);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [session, finish]);

  const advance = useCallback(
    (s: MockSession) => {
      const nextIndex = s.index + 1;
      if (nextIndex >= s.problemIds.length) {
        finish(s);
        return;
      }
      const next = { ...s, index: nextIndex };
      saveMockSession(next);
      setSession(next);
      navigate(`/challenges/${next.problemIds[nextIndex]}`);
    },
    [finish, navigate]
  );

  const complete = useCallback(
    (problemId: string) => {
      if (!session || session.problemIds[session.index] !== problemId) return;
      advance({ ...session, results: { ...session.results, [problemId]: "solved" } });
    },
    [session, advance]
  );

  const skip = useCallback(() => {
    if (!session) return;
    const cur = session.problemIds[session.index];
    advance({ ...session, results: { ...session.results, [cur]: "skipped" } });
  }, [session, advance]);

  const endNow = useCallback(() => {
    if (session) finish(session);
  }, [session, finish]);

  const goToCurrent = useCallback(() => {
    if (session) navigate(`/challenges/${session.problemIds[session.index]}`);
  }, [session, navigate]);

  const isCurrent = (problemId?: string) =>
    !!session && !!problemId && session.problemIds[session.index] === problemId;

  return { session, remainingMs, complete, skip, endNow, goToCurrent, isCurrent };
};

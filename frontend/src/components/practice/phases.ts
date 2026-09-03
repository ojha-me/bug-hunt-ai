export interface PracticePhaseDef {
  num: number;
  key: string;
  name: string;
  short: string;
  scriptedOpen: string;
  goal: string;
}

export const PRACTICE_PHASES: PracticePhaseDef[] = [
  {
    num: 1,
    key: "clarify",
    name: "Clarify Requirements",
    short: "Understand the problem before you build anything.",
    scriptedOpen:
      '"Let me make sure I understand the problem before diving in. Could you walk me through the main user flows, roughly how many users we should plan for, and whether reads or writes dominate?"',
    goal: "Pin down the 2-3 core features, scale, read/write ratio, consistency vs availability, and non-functional needs.",
  },
  {
    num: 2,
    key: "estimate",
    name: "Capacity Estimates",
    short: "Back-of-envelope numbers that justify your architecture.",
    scriptedOpen:
      '"Let me ballpark the numbers. Assuming X million daily users and each doing Y requests a day, that is roughly Z requests/s. Peak, maybe 5x. Does that sound like the right ballpark?"',
    goal: "DAU → requests/day → QPS → peak QPS → storage. Order-of-magnitude math, under 2 minutes.",
  },
  {
    num: 3,
    key: "components",
    name: "Core Components",
    short: "Pick from a palette; justify each in one sentence.",
    scriptedOpen:
      '"I would start with the minimal skeleton: a load balancer in front of stateless app servers, a database as source of truth. My Phase-2 numbers show reads are 10x writes, so I would add a cache in front of the database. Does that sound reasonable?"',
    goal: "Start Client → LB → App → DB, add cache/queue/CDN only when the numbers justify it.",
  },
  {
    num: 4,
    key: "high_level",
    name: "High-Level Design",
    short: "Draw the box-and-arrow flow on the whiteboard.",
    scriptedOpen:
      '"The happy path is: client hits the load balancer over HTTPS, it routes to a stateless app server, which reads or writes the database through a cache. Let me draw that, then I will add the queue for heavy background work off the request path."',
    goal: "5-8 nodes, each explained in one sentence, edges labeled (HTTPS, reads, writes). Draw it on the whiteboard and submit for review.",
  },
  {
    num: 5,
    key: "deep_dive",
    name: "Deep Dives & Trade-offs",
    short: "Answer the 'what if' questions on the riskiest piece.",
    scriptedOpen:
      '"The riskiest component here is the database. What happens if it goes down? If it is a single point of failure, I would add a read replica and automated failover, and accept eventual consistency between them — that trades a little consistency for much better availability."',
    goal: "Handle 2+ risk areas (failure, spikes, data loss, latency) and state trade-offs as 'We chose X over Y because of Z'.",
  },
];

export const getPhaseDef = (num: number): PracticePhaseDef =>
  PRACTICE_PHASES.find((p) => p.num === num) ?? PRACTICE_PHASES[0];

export const PHASE_NAMES = PRACTICE_PHASES.map((p) => p.name);

export const phaseCompleteStates = (
  phaseState: { phase_states?: Record<string, unknown> } | null
): Record<number, boolean> => {
  const out: Record<number, boolean> = {};
  const rawPhases = phaseState?.phase_states?.phases;
  if (rawPhases && typeof rawPhases === "object") {
    Object.entries(rawPhases as Record<string, Record<string, unknown>>).forEach(([num, val]) => {
      out[Number(num)] = Boolean(val?.completed);
    });
  }
  return out;
};
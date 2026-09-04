export interface BehavioralCategory {
  name: string;
  assesses: string;
  questions: string[];
  tip?: string;
}

export const STAR = [
  { letter: "S", label: "Situation", detail: "Set the scene in one or two sentences — the context and what was at stake." },
  { letter: "T", label: "Task", detail: "Your specific responsibility or the problem you owned." },
  { letter: "A", label: "Action", detail: "What YOU did (not the team) — the decisions, trade-offs, and steps. Spend most of your time here." },
  { letter: "R", label: "Result", detail: "The outcome, quantified where possible, plus what you learned." },
];

export const GENERAL_TIPS = [
  "Prepare 5–6 strong stories from your own experience; each can answer several questions with a small reframe.",
  "Quantify impact — “cut analyst workload ~75%”, “scaled to 300+ inboxes” — numbers make stories land.",
  "Keep each answer to ~2 minutes. Practice out loud; rambling is the most common failure.",
  "Say “I”, not “we” — interviewers are assessing YOU, so make your specific contribution unmistakable.",
  "It's fine to pause and structure. Starting with “The situation was…” buys you a beat and signals STAR.",
];

export const BEHAVIORAL_CATEGORIES: BehavioralCategory[] = [
  {
    name: "Project Deep-Dive",
    assesses: "Technical depth, ownership, and whether you can explain complex work clearly.",
    tip: "Pick a project where YOU made the key decisions. Be ready to go 3 levels deep on any choice and defend a trade-off.",
    questions: [
      "Tell me about a project you're most proud of.",
      "Walk me through the most technically challenging thing you've built.",
      "Describe a system you designed end-to-end — what were the key decisions and trade-offs?",
      "Tell me about something you built that had real, measurable impact.",
      "What part of that project would you do differently now?",
    ],
  },
  {
    name: "Conflict & Collaboration",
    assesses: "Communication, empathy, and maturity under disagreement — critical for remote teams.",
    tip: "Show that you sought to understand the other view, used data or a prototype to resolve it, and preserved the relationship. Avoid villain stories.",
    questions: [
      "Tell me about a disagreement with a teammate over a technical decision.",
      "Describe a time you had to influence a decision without any authority.",
      "How did you handle a difficult stakeholder or product owner?",
      "Tell me about a time you received tough code-review feedback.",
      "When have you had to give a colleague hard feedback?",
    ],
  },
  {
    name: "Failure & Mistakes",
    assesses: "Accountability and growth mindset — do you own mistakes and learn, or deflect?",
    tip: "Pick a real, non-trivial failure, own your part plainly, and spend most of the answer on what you changed afterward. The NER/data-leak fix is a strong angle: an incident, a concrete safeguard, prevention.",
    questions: [
      "Tell me about a time you failed.",
      "Describe a bug or outage you caused — how did you handle it?",
      "Tell me about a decision you got wrong.",
      "What's the hardest piece of feedback you've received, and what did you do with it?",
      "When did you realize you were on the wrong track, and how did you course-correct?",
    ],
  },
  {
    name: "Ownership & Initiative",
    assesses: "Drive and autonomy — the single most important signal for a remote role.",
    tip: "Remote teams hire people who spot problems and act without being told. Show initiative that wasn't assigned to you.",
    questions: [
      "Tell me about a time you went beyond your assigned work.",
      "Describe something you improved that nobody asked you to.",
      "When have you taken a calculated risk?",
      "Tell me about a time you drove a project from ambiguity to done.",
      "How do you decide what to work on when no one is directing you?",
    ],
  },
  {
    name: "Ambiguity & Pressure",
    assesses: "How you prioritize, decide with incomplete information, and stay calm under load.",
    tip: "Show a decision framework: clarify the goal, list unknowns, make the smallest reversible bet, and communicate. Interviewers want structured thinking, not heroics.",
    questions: [
      "Tell me about a tight deadline with unclear requirements.",
      "How do you prioritize when everything feels urgent?",
      "Describe a decision you made without all the information you wanted.",
      "Tell me about a time you had to cut scope to ship.",
      "How do you handle competing priorities from different people?",
    ],
  },
  {
    name: "Motivation & Fit",
    assesses: "Whether you actually want this role, and how you'll fit a distributed team.",
    tip: "Be specific and honest. Tie your reasons to the company/product and to how you work best. For remote: show you're self-directed and communicate proactively.",
    questions: [
      "Why do you want to work here / on this product?",
      "Why are you looking to leave your current role?",
      "What does your ideal working environment look like?",
      "How do you stay effective and connected on a remote team?",
      "Where do you want to grow over the next couple of years?",
    ],
  },
  {
    name: "Growth & Self-awareness",
    assesses: "Honest self-assessment and how deliberately you learn.",
    tip: "For weaknesses, name a real one and the concrete system you use to manage it. For learning, show a repeatable method, not just “I Google things.”",
    questions: [
      "What's your greatest strength as an engineer? Your biggest weakness?",
      "How do you approach learning a new technology or codebase?",
      "Tell me about feedback you acted on that changed how you work.",
      "How have you grown most in the last year?",
      "What kind of work do you want to do more of?",
    ],
  },
];

import type { TestCaseInput } from "../execution/api_types";

export type Difficulty = "easy" | "medium" | "hard";

export interface ProblemStats {
  attempts: number;
  solved_by_users: number;
}

export interface CodingProblemSummary {
  id: string;
  title: string;
  slug: string;
  difficulty: Difficulty;
  topics: string[];
  stats: ProblemStats | null;
}

export interface ProblemExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface CodingProblemDetail extends CodingProblemSummary {
  description: string;
  examples: ProblemExample[];
  constraints: string[];
  starter_code: string;
  test_cases: TestCaseInput[];
}

export interface ProblemAttempt {
  id: string;
  verdict: "passed" | "failed" | "error" | "timeout";
  passed_count: number;
  total_count: number;
  execution_time_ms: number | null;
  submitted_at: string;
  code: string;
}

export interface MyProgress {
  problem_id: string;
  title: string;
  difficulty: Difficulty;
  topics: string[];
  solved: boolean;
  attempts: number;
  best_passed: number;
  best_total: number;
}

export interface TutorTurn {
  role: "user" | "assistant";
  content: string;
}
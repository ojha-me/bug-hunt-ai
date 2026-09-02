export interface RevisionItem {
  id: number;
  problem_id: string | null;
  title: string;
  difficulty: string;
  topics: string[];
  repetitions: number;
  ease: number;
  interval_days: number;
  due_at: string;
  last_reviewed_at: string | null;
}

export interface ReviewResponse {
  id: number;
  interval_days: number;
  ease: number;
  repetitions: number;
  due_at: string;
}
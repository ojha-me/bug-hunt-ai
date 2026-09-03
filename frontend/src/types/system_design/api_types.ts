import type { ReactFlowDiagram } from "../ai_core/api_types";

export type SDProgressStatus = "not_started" | "learning" | "completed";

export interface SDCourseResponse {
  id: string;
  name: string;
  description: string;
  order: number;
  is_active: boolean;
  lessons_count: number;
}

export interface SDLessonResponse {
  id: string;
  name: string;
  description: string;
  order: number;
  learning_objectives: string[];
  reference_diagram: ReactFlowDiagram | null;
}

export interface SDCourseDetailResponse {
  id: string;
  name: string;
  description: string;
  order: number;
  is_active: boolean;
  lessons: SDLessonResponse[];
}

export interface SDLessonProgressResponse {
  id: string;
  lesson: SDLessonResponse;
  conversation_id: string | null;
  status: SDProgressStatus;
  ai_confidence: number;
  covered_points: string[];
  remaining_points: string[];
  started_at: string | null;
  completed_at: string | null;
}

export interface UserSDCourseResponse {
  id: string;
  course: SDCourseResponse;
  conversation_id: string | null;
  current_lesson: SDLessonResponse | null;
  progress_percentage: number;
  is_completed: boolean;
  started_at: string;
  completed_at: string | null;
  is_active: boolean;
  progress: SDLessonProgressResponse[];
}

export interface SDLearningMessage {
  id: string;
  sender: "user" | "ai";
  content: string;
  timestamp: string;
  code_snippet: string | null;
  language: string | null;
  type?: string | null;
  next_action?: string | null;
  diagram?: ReactFlowDiagram | null;
}

export type SDCaseStudyDifficulty = "easy" | "medium" | "hard";

export interface SDCaseStudySummary {
  id: string;
  title: string;
  slug: string;
  difficulty: SDCaseStudyDifficulty;
  topics: string[];
  overview: string;
}

export interface SDCaseStudyDetail extends SDCaseStudySummary {
  functional_requirements: string[];
  non_functional_requirements: string[];
  capacity: Record<string, string>;
  key_components: { name: string; responsibility: string }[];
  tradeoffs: string[];
  reference_diagram: ReactFlowDiagram | null;
}

export type SDPracticeStatus = "in_progress" | "completed";

export interface SDPracticeSessionResponse {
  id: string;
  case_study: SDCaseStudyDetail;
  conversation_id: string;
  current_phase: number;
  phase_states: Record<string, unknown>;
  weak_areas: string[];
  status: SDPracticeStatus;
  started_at: string;
  completed_at: string | null;
}
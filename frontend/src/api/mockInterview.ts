import apiClient from "./apiClient";
import type { CodingProblemDetail } from "../types/challenges/api_types";

export interface InterviewEvaluation {
  verdict: "strong_hire" | "hire" | "lean_hire" | "no_hire";
  scores: {
    correctness: number;
    communication: number;
    problem_solving: number;
    coding: number;
    speed: number;
  };
  passed: number;
  total: number;
  strengths: string[];
  improvements: string[];
  summary: string;
}

export interface MockInterview {
  id: string;
  conversation_id: string;
  problem: CodingProblemDetail;
  duration_minutes: number;
  evaluation: InterviewEvaluation | null;
  final_code: string;
}

export interface CreateMockInterviewParams {
  problem_id?: string;
  difficulty?: string;
  list_slug?: string;
  duration_minutes?: number;
}

export const createMockInterview = async (params: CreateMockInterviewParams): Promise<MockInterview> => {
  const response = await apiClient.post<MockInterview>("/challenges/mock-interview", params);
  return response.data;
};

export const getMockInterview = async (conversationId: string): Promise<MockInterview> => {
  const response = await apiClient.get<MockInterview>(`/challenges/mock-interview/${conversationId}`);
  return response.data;
};

export const listMockInterviews = async (): Promise<MockInterview[]> => {
  const response = await apiClient.get<MockInterview[]>("/challenges/mock-interviews");
  return response.data;
};

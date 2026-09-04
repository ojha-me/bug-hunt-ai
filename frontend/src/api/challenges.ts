import apiClient from "./apiClient";
import type {
  CodingProblemSummary,
  CodingProblemDetail,
  ProblemAttempt,
  MyProgress,
  TutorTurn,
} from "../types/challenges/api_types";
import type { RunResponse } from "../types/execution/api_types";

export interface ProblemListSummary {
  slug: string;
  name: string;
  description: string;
  problem_slugs: string[];
  count: number;
}

export const getProblemLists = async (): Promise<ProblemListSummary[]> => {
  const response = await apiClient.get<ProblemListSummary[]>("/challenges/lists");
  return response.data;
};

export const getProblems = async (): Promise<CodingProblemSummary[]> => {
  const response = await apiClient.get<CodingProblemSummary[]>("/challenges/problems");
  return response.data;
};

export const getMyProblemProgress = async (): Promise<MyProgress[]> => {
  const response = await apiClient.get<MyProgress[]>("/challenges/my-progress");
  return response.data;
};

export const getProblem = async (problemId: string): Promise<CodingProblemDetail> => {
  const response = await apiClient.get<CodingProblemDetail>(`/challenges/problems/${problemId}`);
  return response.data;
};

export const submitProblem = async (
  problemId: string,
  code: string,
  language: string
): Promise<RunResponse> => {
  const response = await apiClient.post<RunResponse>(`/challenges/problems/${problemId}/submit`, {
    code,
    language,
  });
  return response.data;
};

// Judge against the problem's stored test cases without recording an attempt.
export const runProblem = async (
  problemId: string,
  code: string,
  language: string
): Promise<RunResponse> => {
  const response = await apiClient.post<RunResponse>(`/challenges/problems/${problemId}/run`, {
    code,
    language,
  });
  return response.data;
};

export const getProblemAttempts = async (problemId: string): Promise<ProblemAttempt[]> => {
  const response = await apiClient.get<ProblemAttempt[]>(`/challenges/problems/${problemId}/attempts`);
  return response.data;
};

export const getProblemTutorHistory = async (problemId: string): Promise<TutorTurn[]> => {
  const response = await apiClient.get<{ history: TutorTurn[] }>(`/challenges/problems/${problemId}/chat`);
  return response.data.history ?? [];
};

export const postProblemTutorChat = async (
  problemId: string,
  message: string,
  code: string
): Promise<{ reply: string; history: TutorTurn[] }> => {
  const response = await apiClient.post(`/challenges/problems/${problemId}/chat`, { message, code });
  return response.data;
};
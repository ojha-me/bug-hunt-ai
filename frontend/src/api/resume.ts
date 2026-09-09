import apiClient from "./apiClient";

export interface ResumeSummary {
  id: string;
  name: string;
  is_primary: boolean;
  updated_at: string;
}

export interface Resume extends ResumeSummary {
  content: string;
}

export interface BulletRewrite {
  before: string;
  after: string;
}

export interface ReviewFeedback {
  match_score: number;
  summary: string;
  matched_keywords: string[];
  missing_keywords: string[];
  strengths: string[];
  gaps: string[];
  bullet_rewrites: BulletRewrite[];
  tailoring_tips: string[];
}

export interface TailoredBullet {
  context: string;
  text: string;
}

export interface TailoredPieces {
  summary: string;
  skills: string;
  bullets: TailoredBullet[];
}

export interface ResumeReview {
  id: string;
  role_title: string;
  job_description: string;
  resume_id: string | null;
  feedback: ReviewFeedback;
  tailored: TailoredPieces | null;
  created_at: string;
}

export interface ReviewSummary {
  id: string;
  role_title: string;
  match_score: number;
  created_at: string;
}

export const listResumes = async (): Promise<ResumeSummary[]> => {
  const res = await apiClient.get<ResumeSummary[]>("/resume/resumes");
  return res.data;
};

export const getResume = async (id: string): Promise<Resume> => {
  const res = await apiClient.get<Resume>(`/resume/resumes/${id}`);
  return res.data;
};

export const createResume = async (params: { name?: string; content?: string; is_primary?: boolean }): Promise<Resume> => {
  const res = await apiClient.post<Resume>("/resume/resumes", params);
  return res.data;
};

export const updateResume = async (
  id: string,
  params: { name?: string; content?: string; is_primary?: boolean }
): Promise<Resume> => {
  const res = await apiClient.post<Resume>(`/resume/resumes/${id}/update`, params);
  return res.data;
};

export const deleteResume = async (id: string): Promise<void> => {
  await apiClient.post(`/resume/resumes/${id}/delete`, {});
};

export const reviewResume = async (params: {
  job_description: string;
  resume_id?: string;
  resume_content?: string;
  role_title?: string;
}): Promise<ResumeReview> => {
  const res = await apiClient.post<ResumeReview>("/resume/review", params);
  return res.data;
};

export const tailorReview = async (reviewId: string): Promise<ResumeReview> => {
  const res = await apiClient.post<ResumeReview>(`/resume/reviews/${reviewId}/tailor`, {});
  return res.data;
};

export const listReviews = async (): Promise<ReviewSummary[]> => {
  const res = await apiClient.get<ReviewSummary[]>("/resume/reviews");
  return res.data;
};

export const getReview = async (id: string): Promise<ResumeReview> => {
  const res = await apiClient.get<ResumeReview>(`/resume/reviews/${id}`);
  return res.data;
};

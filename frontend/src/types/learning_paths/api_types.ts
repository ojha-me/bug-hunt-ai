/* tslint:disable */
/* eslint-disable */
/**
/* This file was automatically generated from pydantic models by running pydantic2ts.
/* Do not modify it by hand - just update the pydantic models and then re-run the script
*/

export interface CompleteSubtopicRequest {
  subtopic_id: string;
  challenges_completed?: number | null;
  challenges_attempted?: number | null;
  notes?: string | null;
}
export interface CreateLearningPathRequest {
  topic_id: string;
}
export interface GenerateTopicPathRequest {
  topic_name: string;
  user_level: string;
  specific_goals?: string[] | null;
}
export interface LearningObjectiveSchema {
  objective: string;
}
export interface LearningSubtopicResponse {
  id: string;
  name: string;
  description: string;
  order: number;
  learning_objectives: string[];
  estimated_duration: string;
  is_active: boolean;
}
export interface LearningTopicDetailResponse {
  id: string;
  name: string;
  description: string;
  difficulty_level: string;
  estimated_duration: string;
  is_active: boolean;
  created_at: string;
  subtopics?: LearningSubtopicResponse[];
}
export interface LearningTopicResponse {
  id: string;
  name: string;
  description: string;
  difficulty_level: string;
  estimated_duration: string;
  is_active: boolean;
  created_at: string;
  subtopics_count: number | null;
  prerequisites?: LearningTopicResponse[];
}
export interface Schema {}
export interface StartSubtopicRequest {
  subtopic_id: string;
}
export interface SubtopicProgressResponse {
  id: string;
  subtopic: LearningSubtopicResponse;
  conversation_id: string | null;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  challenges_completed: number;
  challenges_attempted: number;
  challenge_success_rate: number;
  notes: string;
}
export interface UpdateProgressRequest {
  subtopic_id: string;
  status: string;
  notes?: string | null;
}
export interface UserLearningPathResponse {
  id: string;
  topic: LearningTopicResponse;
  conversation_id: string;
  current_subtopic: LearningSubtopicResponse | null;
  progress_percentage: number;
  is_completed: boolean;
  started_at: string;
  completed_at: string | null;
  is_active: boolean;
  progress: SubtopicProgressResponse[];
}

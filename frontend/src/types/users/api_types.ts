/* tslint:disable */
/* eslint-disable */
/**
/* This file was automatically generated from pydantic models by running pydantic2ts.
/* Do not modify it by hand - just update the pydantic models and then re-run the script
*/

export type SkillLevelChoices = "beginner" | "intermediate" | "advanced";

export interface CreateUserResponse {
  id: string;
  attributes: UserResponseAttributes;
}
export interface UserResponseAttributes {
  email: string;
  first_name: string;
  last_name: string;
  skill_level: SkillLevelChoices;
  date_joined: string;
  is_active: boolean;
  is_staff: boolean;
}
export interface CreateUserSchema {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  skill_level: SkillLevelChoices;
}
export interface GoogleAuthParams {
  credential: string;
}
export interface LoginParams {
  email: string;
  password: string;
}
export interface LogoutParams {
  refresh_token: string;
}
export interface Schema {}
export interface TokenResponse {
  access_token: string;
}
export interface UserProfileResponse {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  skill_level: string;
  date_joined: string;
  stats: UserStatsResponse;
}
export interface UserStatsResponse {
  total_conversations: number;
  total_messages: number;
  learning_paths_enrolled: number;
  learning_paths_completed: number;
  code_executions: number;
  successful_executions: number;
  total_time_spent_seconds: number;
  average_session_duration_seconds: number;
  messages_sent: number;
  messages_received: number;
  challenges_completed: number;
  challenges_attempted: number;
  current_streak_days: number;
}

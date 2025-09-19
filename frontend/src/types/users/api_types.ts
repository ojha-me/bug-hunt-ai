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
export interface Schema {}

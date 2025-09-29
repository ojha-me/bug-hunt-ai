/* tslint:disable */
/* eslint-disable */
/**
/* This file was automatically generated from pydantic models by running pydantic2ts.
/* Do not modify it by hand - just update the pydantic models and then re-run the script
*/

export type MessageLanguageChoices = "python" | "javascript" | "typescript";

export interface ConversationResponse {
  id: string;
  title: string;
  created_at: string;
  last_active_at: string;
  messages: MessageResponse[] | null;
}
export interface MessageResponse {
  id: string;
  sender: string;
  content: string;
  code_snippet: string | null;
  language: MessageLanguageChoices | null;
  timestamp: string;
}
export interface CreateConversationSchema {
  id: string;
  title: string;
}
export interface Schema {}
export interface UpdateConversationTitleSchema {
  conversation_id: string;
  title: string;
}

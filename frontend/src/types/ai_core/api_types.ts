/* tslint:disable */
/* eslint-disable */
/**
/* This file was automatically generated from pydantic models by running pydantic2ts.
/* Do not modify it by hand - just update the pydantic models and then re-run the script
*/

export type MessageLanguageChoices = "python" | "javascript" | "typescript";

export type ConversationTypeChoices = "general" | "learning_path" | "system_design" | "system_design_learning" | "system_design_practice";

export type ComponentType = "input" | "default" | "output";

export interface ReactFlowDiagram {
  nodes: {
    id: string;
    type?: ComponentType;
    position: { x: number; y: number };
    data: { label: string };
  }[];
  edges: {
    id: string;
    source: string;
    target: string;
    label?: string;
  }[];
}

export interface ConversationResponse {
  id: string;
  title: string;
  created_at: string;
  last_active_at: string;
  conversation_type?: ConversationTypeChoices | null;
  messages: MessageResponse[] | null;
}
export interface MessageResponse {
  id: string;
  sender: string;
  content: string;
  code_snippet: string | null;
  language: MessageLanguageChoices | null;
  timestamp: string;
  diagram?: ReactFlowDiagram | null;
}
export interface CreateConversationSchema {
  id: string;
  title: string;
  conversation_type?: ConversationTypeChoices;
}
export interface Schema {}
export interface UpdateConversationTitleSchema {
  conversation_id: string;
  title: string;
}

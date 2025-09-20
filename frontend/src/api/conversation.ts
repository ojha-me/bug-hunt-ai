import type { ConversationResponse, CreateConversationSchema } from "../types/ai_core/api_types";
import apiClient from "./apiClient"

export const createConversation = async (newUser: CreateConversationSchema): Promise<ConversationResponse> => {
    const response = await apiClient.post('conversations/conversation/', newUser);
    return response.data;
  };